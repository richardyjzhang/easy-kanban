<!-- H5 项目管理（P5 子页）：列表、新建／编辑／归档、上下移排序与删除确认。 -->
<script setup lang="ts">
import { NAlert, NButton, NDropdown, NEmpty, NIcon, NInput, NModal, NSpace } from 'naive-ui'
import type { DropdownOption } from 'naive-ui'
import {
  AddOutline,
  ArrowUndoOutline,
  ChevronForwardOutline,
  EllipsisHorizontalOutline,
  TrashOutline,
} from '@vicons/ionicons5'
import { computed, onMounted, ref } from 'vue'

import ColorDot from '../components/ColorDot.vue'
import MobilePageHead from '../components/MobilePageHead.vue'
import ProjectDialog from '../components/ProjectDialog.vue'
import { messageOfError } from '../api/client'
import { dialog, message } from '../feedback'
import { useDataStore } from '../stores/data'
import { formatDateTime } from '../utils/format'
import type { Project } from '../types'

const data = useDataStore()

const active = computed(() => data.activeProjects)
const archived = computed(() => data.archivedProjects)

const dialogOpen = ref(false)
const editing = ref<Project | null>(null)
const archivedOpen = ref(false)

const deleteTarget = ref<Project | null>(null)
const confirmName = ref('')
const deleteError = ref('')
const deleting = ref(false)

const deleteOpen = computed({
  get: () => deleteTarget.value !== null,
  set: (value: boolean) => {
    if (!value) deleteTarget.value = null
  },
})

onMounted(() => {
  data.load().catch(() => {})
})

/** 项目下未完成任务数。 */
function countFor(id: number): number {
  return data.activeTaskCountByProject.get(id) ?? 0
}

/** 项目下全部任务数（含已完成）。 */
function totalTasksFor(id: number): number {
  return data.tasks.filter((task) => task.project_id === id).length
}

/** 打开新建项目弹层。 */
function openCreate(): void {
  editing.value = null
  dialogOpen.value = true
}

/** 打开编辑项目弹层。 */
function openEdit(project: Project): void {
  editing.value = project
  dialogOpen.value = true
}

/** 每一行的操作菜单；首尾行的上移／下移置灰。 */
function menuOptions(index: number): DropdownOption[] {
  return [
    { label: '编辑', key: 'edit' },
    { label: '上移', key: 'up', disabled: index === 0 },
    { label: '下移', key: 'down', disabled: index === active.value.length - 1 },
    { label: '归档', key: 'archive' },
    { label: '删除', key: 'delete' },
  ]
}

/** 行菜单分发。 */
function handleMenu(key: string | number, project: Project, index: number): void {
  if (key === 'edit') openEdit(project)
  else if (key === 'up') void moveProject(index, -1)
  else if (key === 'down') void moveProject(index, 1)
  else if (key === 'archive') askArchive(project)
  else if (key === 'delete') askDelete(project)
}

/** H5 不做拖拽，用上下移保存项目顺序。 */
async function moveProject(index: number, delta: number): Promise<void> {
  const target = index + delta
  if (target < 0 || target >= active.value.length) return
  const ids = active.value.map((project) => project.id)
  ;[ids[index], ids[target]] = [ids[target], ids[index]]
  try {
    await data.reorderProjects(ids)
  } catch (cause) {
    message.error(messageOfError(cause))
  }
}

/** 归档前先做本地检查。 */
function askArchive(project: Project): void {
  const count = countFor(project.id)
  if (count > 0) {
    message.warning(`「${project.name}」还有 ${count} 条未完成任务，请先转移或完成`)
    return
  }
  dialog.warning({
    title: '归档项目',
    content: `归档后「${project.name}」将从矩阵中收起，历史任务仍保留，随时可以恢复。`,
    positiveText: '归档',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await data.archiveProject(project.id)
        message.success(`已归档「${project.name}」`)
      } catch (cause) {
        message.error(messageOfError(cause))
        return false
      }
    },
  })
}

/** 删除前检查项目下是否有任务。 */
function askDelete(project: Project): void {
  const count = totalTasksFor(project.id)
  if (count > 0) {
    message.warning(`「${project.name}」下还有 ${count} 条任务，请先删除任务或改用归档`)
    return
  }
  deleteTarget.value = project
  confirmName.value = ''
  deleteError.value = ''
}

/** 关闭删除弹层（删除中不允许）。 */
function closeDelete(): void {
  if (deleting.value) return
  deleteOpen.value = false
}

/** 校验收到的项目名后删除项目。 */
async function confirmDelete(): Promise<void> {
  const target = deleteTarget.value
  if (!target) return
  // 约定：必须输入与项目名称完全一致的确认名。
  if (confirmName.value.trim() !== target.name) {
    deleteError.value = '请输入与项目名称完全一致的确认名'
    return
  }

  deleting.value = true
  deleteError.value = ''
  try {
    await data.deleteProject(target.id, target.name)
    message.success(`已删除「${target.name}」`)
    deleteTarget.value = null
  } catch (cause) {
    deleteError.value = messageOfError(cause)
    message.error(messageOfError(cause))
  } finally {
    deleting.value = false
  }
}

/** 恢复已归档项目。 */
async function restore(project: Project): Promise<void> {
  try {
    await data.restoreProject(project.id)
    message.success(`已恢复「${project.name}」`)
  } catch (cause) {
    message.error(messageOfError(cause))
  }
}
</script>

<template>
  <div class="m-subpage">
    <mobile-page-head title="项目管理">
      <n-button type="primary" size="small" @click="openCreate">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        新建
      </n-button>
    </mobile-page-head>

    <div class="m-body">
      <n-empty v-if="!active.length" description="还没有项目" class="m-empty" />

      <div v-else class="m-list">
        <article v-for="(project, index) in active" :key="project.id" class="m-row">
          <ColorDot :color="project.color" :size="10" />
          <div class="m-row-main">
            <p class="m-row-name">{{ project.name }}</p>
            <p class="m-row-meta">
              {{ countFor(project.id) }} 条进行中<template v-if="project.description">
                · {{ project.description }}</template
              >
            </p>
          </div>
          <n-dropdown
            trigger="click"
            :options="menuOptions(index)"
            @select="(key) => handleMenu(key, project, index)"
          >
            <n-button quaternary circle size="small" aria-label="更多操作">
              <template #icon>
                <n-icon :component="EllipsisHorizontalOutline" :size="18" />
              </template>
            </n-button>
          </n-dropdown>
        </article>
      </div>

      <div class="m-archived">
        <button type="button" class="m-archived-toggle" @click="archivedOpen = !archivedOpen">
          <n-icon
            :component="ChevronForwardOutline"
            :size="15"
            class="m-chevron"
            :class="{ rotated: archivedOpen }"
          />
          已归档 <span class="m-faint">({{ archived.length }})</span>
        </button>

        <div v-if="archivedOpen" class="m-archived-body">
          <p v-if="!archived.length" class="m-archived-empty">没有已归档的项目。</p>
          <article v-for="project in archived" :key="project.id" class="m-archived-row">
            <ColorDot :color="project.color" :size="8" />
            <div class="m-row-main">
              <p class="m-row-name">{{ project.name }}</p>
              <p class="m-row-meta">{{ formatDateTime(project.archived_at) }} 归档</p>
            </div>
            <n-button text type="primary" size="small" @click="restore(project)">
              <template #icon>
                <n-icon :component="ArrowUndoOutline" />
              </template>
              恢复
            </n-button>
            <n-button text type="error" size="small" @click="askDelete(project)">
              <template #icon>
                <n-icon :component="TrashOutline" />
              </template>
              删除
            </n-button>
          </article>
        </div>
      </div>
    </div>

    <project-dialog v-model:open="dialogOpen" :project="editing" />

    <n-modal
      v-model:show="deleteOpen"
      preset="card"
      title="删除项目"
      :style="{ width: 'min(440px, 92vw)' }"
      :bordered="false"
      :mask-closable="!deleting"
    >
      <n-alert type="warning" :show-icon="true" title="此操作不可恢复">
        项目下还有任务时无法删除，建议改用归档。请输入项目名称
        <strong>{{ deleteTarget?.name }}</strong> 以确认：
      </n-alert>

      <div class="delete-input" @keydown.enter="confirmDelete">
        <n-input
          v-model:value="confirmName"
          :placeholder="deleteTarget?.name"
          :status="deleteError ? 'error' : undefined"
        />
      </div>
      <p v-if="deleteError" class="dialog-error">{{ deleteError }}</p>

      <n-space justify="end" class="dialog-actions">
        <n-button :disabled="deleting" @click="closeDelete">取消</n-button>
        <n-button type="error" :loading="deleting" @click="confirmDelete">删除项目</n-button>
      </n-space>
    </n-modal>
  </div>
</template>

<style scoped>
.m-subpage {
  min-height: 100dvh;
  background: var(--bg);
}

.m-body {
  padding: 12px 12px 28px;
}

.m-empty {
  padding: 48px 0;
}

.m-list {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.m-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px;
  border-bottom: 1px solid var(--border);
}

.m-row:last-child {
  border-bottom: 0;
}

.m-row-main {
  flex: 1;
  min-width: 0;
}

.m-row-name {
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-row-meta {
  margin-top: 2px;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-archived {
  margin-top: 18px;
}

.m-archived-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 2px;
  border: 0;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
}

.m-chevron {
  transition: transform 0.15s ease;
}

.m-chevron.rotated {
  transform: rotate(90deg);
}

.m-faint {
  color: var(--text-faint);
}

.m-archived-body {
  margin-top: 6px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}

.m-archived-empty {
  padding: 18px 14px;
  color: var(--text-faint);
  font-size: 12px;
}

.m-archived-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 12px;
  border-bottom: 1px solid var(--border);
}

.m-archived-row:last-child {
  border-bottom: 0;
}

.delete-input {
  margin-top: 16px;
}
</style>
