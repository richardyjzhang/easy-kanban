<!-- 设置页项目分区：在册列表、归档分组，删除需输入项目名确认。 -->
<script setup lang="ts">
import {
  NAlert,
  NButton,
  NEmpty,
  NIcon,
  NInput,
  NModal,
  NSpace,
  NTable,
  NTag,
} from 'naive-ui'
import { AddOutline, ChevronForwardOutline } from '@vicons/ionicons5'
import { computed, ref } from 'vue'

import ColorDot from './ColorDot.vue'
import ProjectDialog from './ProjectDialog.vue'
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
  <section class="section">
    <header class="section-head">
      <div>
        <h2>项目</h2>
        <p class="section-sub">
          矩阵的列。归档后项目从矩阵收起；删除项目需要输入名称确认，且项目下不能有任务。
        </p>
      </div>
      <n-button type="primary" size="small" @click="openCreate">
        <template #icon>
          <n-icon :component="AddOutline" />
        </template>
        新建项目
      </n-button>
    </header>

    <n-empty v-if="!active.length" description="还没有项目">
      <template #extra>
        <n-button type="primary" @click="openCreate">新建项目</n-button>
      </template>
    </n-empty>

    <n-table v-else :bordered="false" :single-line="false" size="small">
      <thead>
        <tr>
          <th style="width: 64px">颜色</th>
          <th style="width: 180px">名称</th>
          <th>描述</th>
          <th style="width: 96px; text-align: center">进行中</th>
          <th style="width: 190px; text-align: right">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="project in active" :key="project.id">
          <td><ColorDot :color="project.color" :size="12" /></td>
          <td class="cell-name">{{ project.name }}</td>
          <td class="cell-desc">{{ project.description || '—' }}</td>
          <td style="text-align: center">
            <n-tag :bordered="false" size="small" :type="countFor(project.id) > 0 ? 'info' : 'default'">
              {{ countFor(project.id) }}
            </n-tag>
          </td>
          <td>
            <n-space justify="end" :size="2">
              <n-button text type="primary" size="small" @click="openEdit(project)">编辑</n-button>
              <n-button text size="small" @click="askArchive(project)">归档</n-button>
              <n-button text type="error" size="small" @click="askDelete(project)">删除</n-button>
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
        <p v-if="!archived.length" class="archived-empty">没有已归档的项目。</p>
        <div v-for="project in archived" :key="project.id" class="archived-row">
          <ColorDot :color="project.color" :size="9" />
          <span class="archived-name">{{ project.name }}</span>
          <span class="archived-date">{{ formatDateTime(project.archived_at) }} 归档</span>
          <n-space :size="2">
            <n-button text type="primary" size="small" @click="restore(project)">恢复</n-button>
            <n-button text type="error" size="small" @click="askDelete(project)">删除</n-button>
          </n-space>
        </div>
      </div>
    </div>

    <project-dialog v-model:open="dialogOpen" :project="editing" />

    <n-modal
      v-model:show="deleteOpen"
      preset="card"
      title="删除项目"
      :style="{ width: '480px' }"
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
  </section>
</template>

<style scoped>
.section {
  padding: 2px 2px 4px;
}

.cell-name {
  font-weight: 500;
}

.cell-desc {
  max-width: 320px;
  overflow: hidden;
  color: var(--text-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
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

.delete-input {
  margin-top: 16px;
}
</style>
