<!-- H5 人员管理（P5 子页）：列表、新建／编辑／归档、上下移排序与归档恢复。 -->
<script setup lang="ts">
import { NButton, NDropdown, NEmpty, NIcon } from 'naive-ui'
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
import PersonDialog from '../components/PersonDialog.vue'
import { messageOfError } from '../api/client'
import { dialog, message } from '../feedback'
import { useDataStore } from '../stores/data'
import { formatDateTime } from '../utils/format'
import type { Person } from '../types'

const data = useDataStore()

// 约定：系统人员「待分配」只在矩阵里出现，不进入人员管理列表。
const active = computed(() => data.activePeople.filter((person) => !person.is_system))
const archived = computed(() => data.archivedPeople)

const dialogOpen = ref(false)
const editing = ref<Person | null>(null)
const archivedOpen = ref(false)

onMounted(() => {
  data.load().catch(() => {})
})

/** 该人员名下未完成任务数。 */
function countFor(id: number): number {
  return data.activeTaskCountByPerson.get(id) ?? 0
}

/** 该人员名下全部任务数（含已完成）。 */
function totalTasksFor(id: number): number {
  return data.tasks.filter((task) => task.person_id === id).length
}

/** 打开新建人员弹层。 */
function openCreate(): void {
  editing.value = null
  dialogOpen.value = true
}

/** 打开编辑人员弹层。 */
function openEdit(person: Person): void {
  editing.value = person
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
function handleMenu(key: string | number, person: Person, index: number): void {
  if (key === 'edit') openEdit(person)
  else if (key === 'up') void movePerson(index, -1)
  else if (key === 'down') void movePerson(index, 1)
  else if (key === 'archive') askArchive(person)
  else if (key === 'delete') askDelete(person)
}

/** H5 不做拖拽，用上下移保存人员顺序。 */
async function movePerson(index: number, delta: number): Promise<void> {
  const target = index + delta
  if (target < 0 || target >= active.value.length) return
  const ids = active.value.map((person) => person.id)
  ;[ids[index], ids[target]] = [ids[target], ids[index]]
  try {
    await data.reorderPeople(ids)
  } catch (cause) {
    message.error(messageOfError(cause))
  }
}

/** 归档前先做本地检查，避免把注定失败的请求发出去。 */
function askArchive(person: Person): void {
  const count = countFor(person.id)
  if (count > 0) {
    message.warning(`「${person.name}」还有 ${count} 条未完成任务，请先转移或完成`)
    return
  }
  dialog.warning({
    title: '归档人员',
    content: `归档后「${person.name}」将从矩阵中收起，历史任务仍保留，随时可以恢复。`,
    positiveText: '归档',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await data.archivePerson(person.id)
        message.success(`已归档「${person.name}」`)
      } catch (cause) {
        message.error(messageOfError(cause))
        return false
      }
    },
  })
}

/** 删除前检查名下是否有任务。 */
function askDelete(person: Person): void {
  const count = totalTasksFor(person.id)
  if (count > 0) {
    message.warning(`「${person.name}」名下还有 ${count} 条任务，请改用归档`)
    return
  }
  dialog.warning({
    title: '删除人员',
    content: `删除后不可恢复。确定删除「${person.name}」吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await data.deletePerson(person.id)
        message.success(`已删除「${person.name}」`)
      } catch (cause) {
        message.error(messageOfError(cause))
        return false
      }
    },
  })
}

/** 恢复已归档人员。 */
async function restore(person: Person): Promise<void> {
  try {
    await data.restorePerson(person.id)
    message.success(`已恢复「${person.name}」`)
  } catch (cause) {
    message.error(messageOfError(cause))
  }
}
</script>

<template>
  <div class="m-subpage">
    <mobile-page-head title="人员管理">
      <n-button type="primary" size="small" @click="openCreate">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        新建
      </n-button>
    </mobile-page-head>

    <div class="m-body">
      <n-empty v-if="!active.length" description="还没有人员" class="m-empty" />

      <div v-else class="m-list">
        <article v-for="(person, index) in active" :key="person.id" class="m-row">
          <ColorDot :color="person.color" :size="10" />
          <div class="m-row-main">
            <p class="m-row-name">{{ person.name }}</p>
            <p class="m-row-meta">{{ countFor(person.id) }} 条进行中</p>
          </div>
          <n-dropdown
            trigger="click"
            :options="menuOptions(index)"
            @select="(key) => handleMenu(key, person, index)"
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
          <p v-if="!archived.length" class="m-archived-empty">没有已归档的人员。</p>
          <article v-for="person in archived" :key="person.id" class="m-archived-row">
            <ColorDot :color="person.color" :size="8" />
            <div class="m-row-main">
              <p class="m-row-name">{{ person.name }}</p>
              <p class="m-row-meta">{{ formatDateTime(person.archived_at) }} 归档</p>
            </div>
            <n-button text type="primary" size="small" @click="restore(person)">
              <template #icon>
                <n-icon :component="ArrowUndoOutline" />
              </template>
              恢复
            </n-button>
            <n-button text type="error" size="small" @click="askDelete(person)">
              <template #icon>
                <n-icon :component="TrashOutline" />
              </template>
              删除
            </n-button>
          </article>
        </div>
      </div>
    </div>

    <person-dialog v-model:open="dialogOpen" :person="editing" />
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
  color: var(--text-muted);
  font-size: 11px;
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
  gap: 10px;
  padding: 11px 12px;
  border-bottom: 1px solid var(--border);
}

.m-archived-row:last-child {
  border-bottom: 0;
}
</style>
