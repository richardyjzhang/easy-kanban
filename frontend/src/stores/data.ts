// 全量数据仓库：人员、项目、任务及由其派生的分组信息与写操作。

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { api } from '../api'
import { messageOfError } from '../api/client'
import type {
  Person,
  PersonInput,
  Project,
  ProjectInput,
  Task,
  TaskInput,
} from '../types'

/** 按 sort_order 升序，同序时按 id 兜底。 */
function byOrder<T extends { sort_order: number; id: number }>(a: T, b: T): number {
  return a.sort_order - b.sort_order || a.id - b.id
}

export const useDataStore = defineStore('data', () => {
  const people = ref<Person[]>([])
  const projects = ref<Project[]>([])
  const tasks = ref<Task[]>([])

  const loading = ref(false)
  const loaded = ref(false)
  const error = ref<string | null>(null)

  // 同一时刻只允许一个全量请求在飞，避免页面重复挂载时重复拉取。
  let inflight: Promise<void> | null = null

  const activePeople = computed(() => people.value.filter((item) => !item.archived_at).sort(byOrder))
  const archivedPeople = computed(() =>
    people.value.filter((item) => Boolean(item.archived_at)).sort(byOrder),
  )
  const systemPerson = computed(() => people.value.find((item) => item.is_system) ?? null)

  const activeProjects = computed(() =>
    projects.value.filter((item) => !item.archived_at).sort(byOrder),
  )
  const archivedProjects = computed(() =>
    projects.value.filter((item) => Boolean(item.archived_at)).sort(byOrder),
  )

  const personMap = computed(() => new Map(people.value.map((item) => [item.id, item])))
  const projectMap = computed(() => new Map(projects.value.map((item) => [item.id, item])))

  // 约定：进行中任务数的统计口径是 status != 'done'。
  const activeTaskCountByPerson = computed(() => {
    const counts = new Map<number, number>()
    for (const task of tasks.value) {
      if (task.status === 'done') continue
      counts.set(task.person_id, (counts.get(task.person_id) ?? 0) + 1)
    }
    return counts
  })

  const activeTaskCountByProject = computed(() => {
    const counts = new Map<number, number>()
    for (const task of tasks.value) {
      if (task.status === 'done') continue
      counts.set(task.project_id, (counts.get(task.project_id) ?? 0) + 1)
    }
    return counts
  })

  /** 拉取全量数据；force 为真时强制刷新。 */
  function load(force = false): Promise<void> {
    if (inflight) return inflight
    if (loaded.value && !force) return Promise.resolve()

    loading.value = true
    error.value = null
    const promise = (async () => {
      try {
        const state = await api.fetchState()
        people.value = state.people
        projects.value = state.projects
        tasks.value = state.tasks
        loaded.value = true
      } catch (cause) {
        error.value = messageOfError(cause)
        throw cause
      } finally {
        loading.value = false
        inflight = null
      }
    })()
    inflight = promise
    return promise
  }

  /** 清空所有数据（退出登录或 401 时调用）。 */
  function reset(): void {
    people.value = []
    projects.value = []
    tasks.value = []
    loading.value = false
    loaded.value = false
    error.value = null
    inflight = null
  }

  /** 插入或替换一名人员并保持排序。 */
  function upsertPerson(person: Person): void {
    const index = people.value.findIndex((item) => item.id === person.id)
    if (index >= 0) people.value[index] = person
    else people.value.push(person)
    people.value.sort(byOrder)
  }

  /** 只更新人员的归档时间。 */
  function patchPersonArchive(id: number, archivedAt: string | null): void {
    const person = people.value.find((item) => item.id === id)
    if (person) person.archived_at = archivedAt
  }

  /** 新建人员。 */
  async function createPerson(input: PersonInput): Promise<Person> {
    const person = await api.createPerson(input)
    upsertPerson(person)
    return person
  }

  /** 更新人员。 */
  async function updatePerson(id: number, input: PersonInput): Promise<Person> {
    const person = await api.updatePerson(id, input)
    upsertPerson(person)
    return person
  }

  /** 归档人员。 */
  async function archivePerson(id: number): Promise<void> {
    const result = await api.archivePerson(id)
    patchPersonArchive(result.id, result.archived_at)
  }

  /** 恢复人员。 */
  async function restorePerson(id: number): Promise<void> {
    const result = await api.restorePerson(id)
    patchPersonArchive(result.id, result.archived_at)
  }

  /** 删除人员。 */
  async function deletePerson(id: number): Promise<void> {
    await api.deletePerson(id)
    people.value = people.value.filter((item) => item.id !== id)
  }

  /** 插入或替换一个项目并保持排序。 */
  function upsertProject(project: Project): void {
    const index = projects.value.findIndex((item) => item.id === project.id)
    if (index >= 0) projects.value[index] = project
    else projects.value.push(project)
    projects.value.sort(byOrder)
  }

  /** 只更新项目的归档时间。 */
  function patchProjectArchive(id: number, archivedAt: string | null): void {
    const project = projects.value.find((item) => item.id === id)
    if (project) project.archived_at = archivedAt
  }

  /** 新建项目。 */
  async function createProject(input: ProjectInput): Promise<Project> {
    const project = await api.createProject(input)
    upsertProject(project)
    return project
  }

  /** 更新项目。 */
  async function updateProject(id: number, input: ProjectInput): Promise<Project> {
    const project = await api.updateProject(id, input)
    upsertProject(project)
    return project
  }

  /** 归档项目。 */
  async function archiveProject(id: number): Promise<void> {
    const result = await api.archiveProject(id)
    patchProjectArchive(result.id, result.archived_at)
  }

  /** 恢复项目。 */
  async function restoreProject(id: number): Promise<void> {
    const result = await api.restoreProject(id)
    patchProjectArchive(result.id, result.archived_at)
  }

  /** 删除项目。 */
  async function deleteProject(id: number, confirmName: string): Promise<void> {
    await api.deleteProject(id, confirmName)
    projects.value = projects.value.filter((item) => item.id !== id)
  }

  /** 新建任务。 */
  async function createTask(input: TaskInput): Promise<Task> {
    const task = await api.createTask(input)
    tasks.value.push(task)
    return task
  }

  /** 全量更新任务并替换本地对象。 */
  async function updateTask(id: number, input: TaskInput): Promise<Task> {
    const task = await api.updateTask(id, input)
    const index = tasks.value.findIndex((item) => item.id === id)
    if (index >= 0) tasks.value[index] = task
    return task
  }

  /** 删除任务。 */
  async function deleteTask(id: number): Promise<void> {
    await api.deleteTask(id)
    tasks.value = tasks.value.filter((item) => item.id !== id)
  }

  return {
    people,
    projects,
    tasks,
    loading,
    loaded,
    error,
    activePeople,
    archivedPeople,
    systemPerson,
    activeProjects,
    archivedProjects,
    personMap,
    projectMap,
    activeTaskCountByPerson,
    activeTaskCountByProject,
    load,
    reset,
    createPerson,
    updatePerson,
    archivePerson,
    restorePerson,
    deletePerson,
    createProject,
    updateProject,
    archiveProject,
    restoreProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
  }
})
