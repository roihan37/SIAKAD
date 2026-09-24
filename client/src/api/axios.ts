import axios, { type InternalAxiosRequestConfig } from "axios"
import { logout, sessionReceived, passwordChangeRequired } from "@/features/auth-session"
import type { AuthSession, LoginRequest } from "@/types/auth"
import { createSessionManager } from "./session-manager"
import { sessionChanged } from "./auth-errors"
let appStore: typeof import("@/app/store").store
export const injectStore = (store: typeof appStore) => { appStore = store }
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1/"
const settings = { baseURL, withCredentials: true }
export const api = axios.create(settings)
// Cookie-only endpoints never pass through the access-token retry interceptor.
const sessionApi = axios.create({ ...settings, timeout: 15000 })
const lockName = `siakad-session:${baseURL}`
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(lockName) : null
export const sessions = createSessionManager({
  transport: {
    login: async body => (await sessionApi.post<AuthSession>("/auth/login", body)).data,
    refresh: async () => (await sessionApi.post<AuthSession>("/auth/refreshTokens")).data,
    logout: async () => { await sessionApi.post("/auth/logout") },
  },
  lock: operation => typeof navigator !== "undefined" && navigator.locks ? navigator.locks.request(lockName, operation) : operation(),
  receive: session => appStore.dispatch(sessionReceived(session)),
  clear: () => appStore.dispatch(logout()),
  // Tokens/passwords never cross storage or messaging boundaries.
  broadcast: event => channel?.postMessage(event),
})
if (channel) channel.onmessage = event => {
  if (event.data !== "logout" && event.data !== "login") return
  sessions.external(event.data)
  // Remain signed out after logout; a deliberate cross-tab login may restore the new identity.
  if (event.data === "login") void sessions.refresh().catch(() => undefined)
}
export const refreshSession = () => sessions.refresh()
export const loginSession = (body: LoginRequest) => sessions.login(body)
export const endSession = () => sessions.end()
export const finishPasswordChange = () => sessions.invalidate(true)
type AuthRequest = InternalAxiosRequestConfig & { _retry?: boolean; _sessionEpoch?: number }
const isCookieEndpoint = (url = "") => /\/auth\/(login|refreshTokens|logout)\/?(?:\?|$)/.test(url)
api.interceptors.request.use((config: AuthRequest) => {
  if (config._sessionEpoch !== undefined && config._sessionEpoch !== sessions.getEpoch()) throw sessionChanged()
  config._sessionEpoch = sessions.getEpoch()
  const token = appStore.getState().auth.accessToken
  if (token && !isCookieEndpoint(config.url)) config.headers.set("Authorization", `Bearer ${token}`)
  else config.headers.delete("Authorization")
  return config
})
api.interceptors.response.use(response => {
  const config = response.config as AuthRequest
  if (!isCookieEndpoint(config.url) && config._sessionEpoch !== sessions.getEpoch()) throw sessionChanged()
  return response
}, async (error: unknown) => {
  if (!axios.isAxiosError<{ code?: string }>(error)) return Promise.reject(error)
  const request = error.config as AuthRequest | undefined
  if (!request || isCookieEndpoint(request.url)) return Promise.reject(error)
  if (request._sessionEpoch !== sessions.getEpoch()) return Promise.reject(sessionChanged())
  const code = error.response?.data?.code
  if (error.response?.status === 403 && code === "PASSWORD_CHANGE_REQUIRED") appStore.dispatch(passwordChangeRequired())
  if (error.response?.status === 401 && code === "TOKEN_INVALID") sessions.invalidate(true)
  if (error.response?.status === 401 && code === "TOKEN_EXPIRED" && !request._retry) {
    request._retry = true
    try {
      const current = appStore.getState().auth.accessToken
      const token = current && request.headers.get("Authorization") !== `Bearer ${current}` ? current : (await refreshSession()).accessToken
      if (request._sessionEpoch !== sessions.getEpoch()) throw sessionChanged()
      request.headers.set("Authorization", `Bearer ${token}`)
      return api(request)
    } catch (failure) { return Promise.reject(failure) }
  }
  return Promise.reject(error)
})
