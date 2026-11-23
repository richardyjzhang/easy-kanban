// API 客户端：拼 baseURL、注入 Bearer、解析统一错误、把 401 交给外层处理。

const BASE = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '')

/** 部署在子路径时，API 地址会跟随 BASE_URL，例如 /easy-kanban/api。 */
export const API_BASE = `${BASE}/api`

const TOKEN_KEY = 'easy-kanban.token'
const USERNAME_KEY = 'easy-kanban.username'

/** 统一的接口错误，带 HTTP 状态、业务错误码与字段级原因。 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, string>

  constructor(
    status: number,
    code: string,
    message: string,
    details: Record<string, string> = {},
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/** 读取本地保存的 token。 */
export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    // 隐私模式下 localStorage 可能不可用，按未登录处理。
    return null
  }
}

/** 保存 token 到本地。 */
export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    /* 存不了也不影响当前会话，忽略 */
  }
}

/** 清除本地 token。 */
export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

/** 读取登录时记住的用户名，仅用于界面展示。 */
export function getStoredUsername(): string {
  try {
    return window.localStorage.getItem(USERNAME_KEY) ?? ''
  } catch {
    return ''
  }
}

/** 记住登录用户名。 */
export function setStoredUsername(username: string): void {
  try {
    window.localStorage.setItem(USERNAME_KEY, username)
  } catch {
    /* ignore */
  }
}

let unauthorizedHandler: (() => void) | null = null

/** 注册全局 401 处理器（由 main.ts 注入路由跳转逻辑）。 */
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler
}

/** 把任意异常转成适合提示给用户的文案。 */
export function messageOfError(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.message) return error.message
  return '操作失败，请稍后重试'
}

interface ErrorBody {
  error?: {
    code?: string
    message?: string
  }
  details?: Record<string, string>
}

/** 发起请求并解析响应；非 2xx 统一抛出 ApiError。 */
async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 20000)

  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, 'NETWORK', '请求超时，请确认后端服务已启动')
    }
    throw new ApiError(0, 'NETWORK', '无法连接服务器，请确认后端服务已启动')
  } finally {
    window.clearTimeout(timer)
  }

  // 删除接口返回 204，没有响应体。
  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  let payload: unknown = null
  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = null
    }
  }

  if (!response.ok) {
    const errorBody = (payload ?? {}) as ErrorBody
    const apiError = new ApiError(
      response.status,
      errorBody.error?.code ?? 'UNKNOWN',
      errorBody.error?.message ?? `请求失败（HTTP ${response.status}）`,
      errorBody.details ?? {},
    )
    // 登录接口的 401 是密码错误，不触发全局退出逻辑。
    if (response.status === 401 && path !== '/auth/login') {
      unauthorizedHandler?.()
    }
    throw apiError
  }

  return payload as T
}

/** 按 HTTP 方法封装请求，业务层只关心 URL 与类型。 */
export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
