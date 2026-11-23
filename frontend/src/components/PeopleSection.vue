<!-- 设置页人员分区：在册列表、归档分组与相关确认操作。 -->
<script setup lang="ts">
import {
  NButton,
  NEmpty,
  NIcon,
  NSpace,
  NTable,
  NTag,
} from 'naive-ui'
import {
  AddOutline,
  ArchiveOutline,
  ArrowUndoOutline,
  ChevronForwardOutline,
  CreateOutline,
  TrashOutline,
} from '@vicons/ionicons5'
import { computed, ref } from 'vue'

import ColorDot from './ColorDot.vue'
import PersonDialog from './PersonDialog.vue'
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
  <section class="section" aria-label="人员">
    <header class="section-head">
      <div>
        <p class="section-sub">
          矩阵的行。归档后人员从矩阵收起，历史任务仍保留。
        </p>
      </div>
      <n-button type="primary" @click="openCreate">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        新建人员
      </n-button>
    </header>

    <n-empty v-if="!active.length" description="还没有人员" />

    <n-table v-else :bordered="false" :single-line="false" size="small">
      <thead>
        <tr>
          <th style="width: 64px">颜色</th>
          <th>姓名</th>
          <th style="width: 96px; text-align: center">进行中</th>
          <th style="width: 240px; text-align: right">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="person in active" :key="person.id">
          <td><ColorDot :color="person.color" :size="12" /></td>
          <td class="cell-name">{{ person.name }}</td>
          <td style="text-align: center">
            <n-tag :bordered="false" size="small" :type="countFor(person.id) > 0 ? 'info' : 'default'">
              {{ countFor(person.id) }}
            </n-tag>
          </td>
          <td>
            <n-space justify="end" :size="8">
              <n-button text type="primary" size="small" @click="openEdit(person)">
                <template #icon>
                  <n-icon :component="CreateOutline" />
                </template>
                编辑
              </n-button>
              <n-button text size="small" @click="askArchive(person)">
                <template #icon>
                  <n-icon :component="ArchiveOutline" />
                </template>
                归档
              </n-button>
              <n-button text type="error" size="small" @click="askDelete(person)">
                <template #icon>
                  <n-icon :component="TrashOutline" />
                </template>
                删除
              </n-button>
            </n-space>
          </td>
        </tr>
      </tbody>
    </n-table>

    <div class="archived">
      <n-button text @click="archivedOpen = !archivedOpen">
        <template #icon>
          <n-icon
            :component="ChevronForwardOutline"
            class="chevron"
            :class="{ rotated: archivedOpen }"
          />
        </template>
        已归档 <span class="faint">({{ archived.length }})</span>
      </n-button>

      <div v-if="archivedOpen" class="archived-body">
        <p v-if="!archived.length" class="archived-empty">没有已归档的人员。</p>
        <div v-for="person in archived" :key="person.id" class="archived-row">
          <ColorDot :color="person.color" :size="9" />
          <span class="archived-name">{{ person.name }}</span>
          <span class="archived-date">{{ formatDateTime(person.archived_at) }} 归档</span>
          <n-space :size="8">
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
          </n-space>
        </div>
      </div>
    </div>

    <person-dialog v-model:open="dialogOpen" :person="editing" />
  </section>
</template>

<style scoped>
.section {
  padding: 2px 2px 4px;
}

.cell-name {
  font-weight: 500;
}

.archived {
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px dashed var(--border);
}

.chevron {
  transition: transform 0.15s ease;
}

.chevron.rotated {
  transform: rotate(90deg);
}

.archived-body {
  margin-top: 8px;
}

.archived-empty {
  padding: 14px 6px;
  color: var(--text-faint);
  font-size: 13px;
}

.archived-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 6px;
  border-radius: 8px;
  font-size: 13px;
}

.archived-row:hover {
  background: var(--surface-muted);
}

.archived-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archived-date {
  color: var(--text-faint);
  font-size: 12px;
}
</style>
