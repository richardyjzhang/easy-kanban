// 前后端共享的数据类型，字段与 docs/DATA-API.md 保持一致。

export type TaskStatus = 'todo' | 'doing' | 'blocked' | 'done'

export interface Person {
  id: number
  name: string
  color: string
  sort_order: number
  archived_at: string | null
  is_system: boolean
  created_at: string
}

export interface Project {
  id: number
  name: string
  color: string
  description: string
  sort_order: number
  archived_at: string | null
  created_at: string
}

export interface Task {
  id: number
  title: string
  person_id: number
  project_id: number
  start_date: string | null
  end_date: string | null
  status: TaskStatus
  note: string
  created_at: string
  updated_at: string
}

export interface AppState {
  people: Person[]
  projects: Project[]
  tasks: Task[]
}

export interface LoginResponse {
  token: string
  expires_in: number
}

export interface ArchiveResponse {
  id: number
  archived_at: string | null
}

export interface OrderResponse {
  updated: number
}

export interface PersonInput {
  name: string
  color: string
}

export interface ProjectInput {
  name: string
  color: string
  description: string
}

export interface TaskInput {
  title: string
  person_id: number
  project_id: number
  start_date: string | null
  end_date: string | null
  status: TaskStatus
  note: string
}
