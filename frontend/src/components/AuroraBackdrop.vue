<!--
  登录页背景：Canvas 绘制的柔光色斑缓慢漂移，叠一层极淡点阵网格，
  最后盖一层白雾遮罩压住动效，保证正文与卡片始终清晰。

  纯装饰层：aria-hidden、不接收指针事件，位置与尺寸完全跟随父容器。
  系统开启 reduced-motion 时只画一帧静态画面，不做循环。
-->
<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

interface Blob {
  /** 颜色 rgb 分量，例如 '99, 132, 232'。 */
  rgb: string
  /** 半径占画布短边的比例。 */
  radius: number
  /** 叠加强度，越大越显眼；浅色页面上保持很低，避免抢内容。 */
  alpha: number
  /** 静止中心位置，相对画布宽高的 0~1。 */
  x: number
  y: number
  /** 漂移幅度，相对画布宽高的 0~1。 */
  driftX: number
  driftY: number
  /** 水平 / 垂直各自的漂移周期（秒）。取互不整除的值，肉眼看不出循环。 */
  periodX: number
  periodY: number
  /** 起始相位，让几个色斑错开节奏。 */
  phase: number
  /** 透明度呼吸周期（秒），0 表示不呼吸。 */
  breathe: number
}

const TAU = Math.PI * 2
/** 预渲染纹理边长：足够大，放大后不会露出色带。 */
const SPRITE_SIZE = 512
/** 动效本身很慢，30fps 足够，省一半绘制开销。 */
const FRAME_INTERVAL = 1000 / 30

/** 色斑都取主色家族的低饱和调子，铺在浅色底上只留一层若有若无的冷暖差。 */
const BLOBS: Blob[] = [
  {
    rgb: '99, 132, 232',
    radius: 0.74,
    alpha: 0.38,
    x: 0.18,
    y: 0.1,
    driftX: 0.05,
    driftY: 0.06,
    periodX: 71,
    periodY: 97,
    phase: 0,
    breathe: 53,
  },
  {
    rgb: '96, 164, 232',
    radius: 0.62,
    alpha: 0.34,
    x: 0.92,
    y: 0.92,
    driftX: 0.06,
    driftY: 0.05,
    periodX: 89,
    periodY: 61,
    phase: 1.9,
    breathe: 67,
  },
  {
    rgb: '120, 190, 220',
    radius: 0.46,
    alpha: 0.12,
    x: 0.46,
    y: -0.08,
    driftX: 0.07,
    driftY: 0.04,
    periodX: 103,
    periodY: 79,
    phase: 3.4,
    breathe: 0,
  },
  {
    rgb: '150, 150, 230',
    radius: 0.56,
    alpha: 0.2,
    x: 0,
    y: 0.78,
    driftX: 0.04,
    driftY: 0.05,
    periodX: 83,
    periodY: 109,
    phase: 5.1,
    breathe: 59,
  },
]

const root = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

let ctx: CanvasRenderingContext2D | null = null
let sprites: HTMLCanvasElement[] = []
let width = 0
let height = 0
let rafId = 0
/** 已累计的播放时长（秒），暂停后恢复时接着走，位置不会跳。 */
let offset = 0
/** 当前这段播放的起点（毫秒）。 */
let startedAt = 0
let lastPaint = 0
let running = false
let observer: ResizeObserver | null = null
let reducedMotion = false

/** 把一块柔光预渲染成纹理，绘制时只做缩放贴图，不用每帧重建渐变。 */
function createSprite(rgb: string): HTMLCanvasElement {
  const sprite = document.createElement('canvas')
  sprite.width = SPRITE_SIZE
  sprite.height = SPRITE_SIZE

  const g = sprite.getContext('2d')
  if (!g) return sprite

  const half = SPRITE_SIZE / 2
  const gradient = g.createRadialGradient(half, half, 0, half, half, half)
  // 衰减比线性更缓，边缘才不会露出一个明显的圆。
  gradient.addColorStop(0, `rgba(${rgb}, 1)`)
  gradient.addColorStop(0.35, `rgba(${rgb}, 0.55)`)
  gradient.addColorStop(0.65, `rgba(${rgb}, 0.18)`)
  gradient.addColorStop(1, `rgba(${rgb}, 0)`)
  g.fillStyle = gradient
  g.fillRect(0, 0, SPRITE_SIZE, SPRITE_SIZE)

  return sprite
}

/** 按给定的播放时间画一帧。 */
function paint(seconds: number): void {
  const context = ctx
  if (!context) return

  context.clearRect(0, 0, width, height)

  const shortSide = Math.min(width, height)
  BLOBS.forEach((blob, index) => {
    const sprite = sprites[index]
    if (!sprite) return

    const radius = blob.radius * shortSide
    const cx =
      (blob.x + Math.sin((seconds / blob.periodX) * TAU + blob.phase) * blob.driftX) * width
    const cy =
      (blob.y + Math.cos((seconds / blob.periodY) * TAU + blob.phase * 1.7) * blob.driftY) * height
    // 缓慢的明暗呼吸，让画面“活着”但不至于看出节奏。
    const pulse = blob.breathe
      ? 1 + 0.16 * Math.sin((seconds / blob.breathe) * TAU + blob.phase * 2.3)
      : 1

    context.globalAlpha = Math.min(1, Math.max(0, blob.alpha * pulse))
    context.drawImage(sprite, cx - radius, cy - radius, radius * 2, radius * 2)
  })

  context.globalAlpha = 1
}

function currentSeconds(now: number): number {
  return offset + (now - startedAt) / 1000
}

/** 跟随容器尺寸重建画布；DPR 上限 2，避免 4K 屏上白付一倍绘制成本。 */
function resize(): void {
  const el = root.value
  const node = canvas.value
  if (!el || !node) return

  const rect = el.getBoundingClientRect()
  width = Math.max(1, rect.width)
  height = Math.max(1, rect.height)

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  node.width = Math.round(width * dpr)
  node.height = Math.round(height * dpr)

  const context = node.getContext('2d')
  if (!context) return
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx = context

  // 尺寸变了立刻补一帧，拖拽窗口时不会闪出空白。
  paint(running ? currentSeconds(performance.now()) : offset)
}

function frame(now: number): void {
  rafId = requestAnimationFrame(frame)
  if (now - lastPaint < FRAME_INTERVAL) return
  lastPaint = now
  paint(currentSeconds(now))
}

function start(): void {
  if (running || reducedMotion) return
  running = true
  startedAt = performance.now()
  lastPaint = 0
  rafId = requestAnimationFrame(frame)
}

function stop(): void {
  if (running) offset += (performance.now() - startedAt) / 1000
  running = false
  if (rafId) cancelAnimationFrame(rafId)
  rafId = 0
}

/** 切到后台时停掉循环，回来再续上，省电也免得锁屏回来堆帧。 */
function onVisibilityChange(): void {
  if (document.hidden) stop()
  else start()
}

onMounted(() => {
  sprites = BLOBS.map((blob) => createSprite(blob.rgb))
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  resize()
  observer = new ResizeObserver(resize)
  if (root.value) observer.observe(root.value)

  document.addEventListener('visibilitychange', onVisibilityChange)
  // ResizeObserver 感知不到 DPR 变化（跨屏拖拽），单独兜一下。
  window.addEventListener('resize', resize)

  start()
})

onBeforeUnmount(() => {
  stop()
  observer?.disconnect()
  observer = null
  document.removeEventListener('visibilitychange', onVisibilityChange)
  window.removeEventListener('resize', resize)
  sprites = []
  ctx = null
})
</script>

<template>
  <div ref="root" class="aurora" aria-hidden="true">
    <canvas ref="canvas" class="aurora-canvas"></canvas>
    <div class="aurora-grid"></div>
    <div class="aurora-veil"></div>
  </div>
</template>

<style scoped>
.aurora {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  /* 兜底色：canvas 还没画出内容时也不会露出白底。 */
  background:
    radial-gradient(120% 90% at 0% 0%, #eef3ff 0%, transparent 55%),
    radial-gradient(110% 90% at 100% 100%, #eef6fb 0%, transparent 60%),
    linear-gradient(160deg, #f8fbff 0%, #eff4fd 55%, #e9eff9 100%);
}

.aurora-canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

/* 极淡的点阵网格：呼应看板的“矩阵”，只在中上区域隐约露一点。 */
.aurora-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(30, 58, 138, 0.085) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(30, 58, 138, 0.085) 1px, transparent 1px);
  background-size: 76px 76px;
  background-position: -1px -1px;
  -webkit-mask-image: radial-gradient(
    90% 80% at 24% 18%,
    #000 0%,
    rgba(0, 0, 0, 0.45) 55%,
    transparent 88%
  );
  mask-image: radial-gradient(
    90% 80% at 24% 18%,
    #000 0%,
    rgba(0, 0, 0, 0.45) 55%,
    transparent 88%
  );
}

/* 上层白雾：中心透、四周雾的 vignette，再加一层自下而上的白，托住卡片和页脚。 */
.aurora-veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(70% 55% at 50% 50%, transparent 0%, rgba(255, 255, 255, 0.12) 100%),
    linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.04) 0%,
      rgba(255, 255, 255, 0.1) 60%,
      rgba(255, 255, 255, 0.2) 100%
    );
}
</style>
