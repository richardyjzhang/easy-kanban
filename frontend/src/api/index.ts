// 后端接口清单：每个函数对应 docs/DATA-API.md 里的一个端点。

import { credentialDigest } from '../utils/credential'
import { http } from './client'
import type {
  AppState,
  ArchiveResponse,
  LoginResponse,
  OrderResponse,
  Person,
  PersonInput,
  Project,
  ProjectInput,
  Task,
  TaskInput,
} from '../types'

export const api = {
  /** 登录并取得 token；password 字段只传凭据摘要，明文密码不出浏览器。 */
  login(username: string, password: string): Promise<LoginResponse> {
    return http.post<LoginResponse>('/auth/login', {
      username,
      password: credentialDigest(username, password),
    })
  },

  /** 修改密码，成功时返回续签后的新 token；新旧密码同样只传凭据摘要。 */
  changePassword(
    username: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<LoginResponse> {
    return http.post<LoginResponse>('/auth/password', {
      old_password: credentialDigest(username, oldPassword),
      new_password: credentialDigest(username, newPassword),
    })
  },

  /** 拉取全量人员、项目与任务。 */
  fetchState(): Promise<AppState> {
    return http.get<AppState>('/state')
  },

  /** 新建人员。 */
  createPerson(input: PersonInput): Promise<Person> {
    return http.post<Person>('/people', input)
  },

  /** 全量更新人员。 */
  updatePerson(id: number, input: PersonInput): Promise<Person> {
    return http.put<Person>(`/people/${id}`, input)
  },

  /** 归档人员。 */
  archivePerson(id: number): Promise<ArchiveResponse> {
    return http.post<ArchiveResponse>(`/people/${id}/archive`)
  },

  /** 恢复已归档人员。 */
  restorePerson(id: number): Promise<ArchiveResponse> {
    return http.post<ArchiveResponse>(`/people/${id}/restore`)
  },

  /** 删除人员。 */
  deletePerson(id: number): Promise<void> {
    return http.delete<void>(`/people/${id}`)
  },

  /** 批量保存人员顺序（M2 行列拖拽使用）。 */
  savePeopleOrder(ids: number[]): Promise<OrderResponse> {
    return http.put<OrderResponse>('/people/order', { ids })
  },

  /** 新建项目。 */
  createProject(input: ProjectInput): Promise<Project> {
    return http.post<Project>('/projects', input)
  },

  /** 全量更新项目。 */
  updateProject(id: number, input: ProjectInput): Promise<Project> {
    return http.put<Project>(`/projects/${id}`, input)
  },

  /** 归档项目。 */
  archiveProject(id: number): Promise<ArchiveResponse> {
    return http.post<ArchiveResponse>(`/projects/${id}/archive`)
  },

  /** 恢复已归档项目。 */
  restoreProject(id: number): Promise<ArchiveResponse> {
    return http.post<ArchiveResponse>(`/projects/${id}/restore`)
  },

  /** 删除项目，必须回传项目名称做二次确认。 */
  deleteProject(id: number, confirmName: string): Promise<void> {
    return http.delete<void>(
      `/projects/${id}?confirm_name=${encodeURIComponent(confirmName)}`,
    )
  },

  /** 批量保存项目顺序（M2 行列拖拽使用）。 */
  saveProjectsOrder(ids: number[]): Promise<OrderResponse> {
    return http.put<OrderResponse>('/projects/order', { ids })
  },

  /** 新建任务。 */
  createTask(input: TaskInput): Promise<Task> {
    return http.post<Task>('/tasks', input)
  },

  /** 全量更新任务；改状态、改归属也走这里。 */
  updateTask(id: number, input: TaskInput): Promise<Task> {
    return http.put<Task>(`/tasks/${id}`, input)
  },

  /** 删除任务。 */
  deleteTask(id: number): Promise<void> {
    return http.delete<void>(`/tasks/${id}`)
  },
}
