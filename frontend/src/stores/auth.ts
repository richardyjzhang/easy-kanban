// 登录状态仓库：token、用户名以及登录/改密/退出动作。

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { api } from '../api'
import {
  clearToken,
  getStoredUsername,
  getToken,
  setStoredUsername,
  setToken,
} from '../api/client'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getToken())
  const username = ref<string>(getStoredUsername())

  const isAuthenticated = computed(() => Boolean(token.value))

  /** 写入并持久化新的 token。 */
  function applyToken(nextToken: string): void {
    token.value = nextToken
    setToken(nextToken)
  }

  /** 登录并记住用户名。 */
  async function login(name: string, password: string): Promise<void> {
    const result = await api.login(name.trim(), password)
    applyToken(result.token)
    username.value = name.trim()
    setStoredUsername(name.trim())
  }

  /** 修改密码；服务端会让旧 token 失效并换发新 token。 */
  async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const result = await api.changePassword(oldPassword, newPassword)
    applyToken(result.token)
  }

  /** 清除本地登录凭证。 */
  function clear(): void {
    token.value = null
    clearToken()
  }

  /** 退出登录并清空用户名。 */
  function logout(): void {
    clear()
    username.value = ''
    setStoredUsername('')
  }

  return { token, username, isAuthenticated, login, changePassword, clear, logout }
})
