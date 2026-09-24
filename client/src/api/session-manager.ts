import type { AuthSession, LoginRequest } from "@/types/auth"
import { authFailure, sessionChanged } from "./auth-errors"
interface Transport {
  login(body: LoginRequest): Promise<AuthSession>
  refresh(): Promise<AuthSession>
  logout(): Promise<void>
}
interface Dependencies {
  transport: Transport
  lock<T>(operation: () => Promise<T>): Promise<T>
  receive(session: AuthSession): void
  clear(): void
  broadcast(event: "logout" | "login"): void
}
export function createSessionManager(deps: Dependencies) {
  let epoch = 0
  let blocked = false
  let refreshing: Promise<AuthSession> | null = null
  let signingIn: Promise<AuthSession> | null = null
  let ending: Promise<void> | null = null
  let refreshRetryAt = 0
  function invalidate(broadcast = false) {
    epoch++; blocked = true; deps.clear()
    if (broadcast) deps.broadcast("logout")
  }
  function refresh(): Promise<AuthSession> {
    if (blocked) return Promise.reject(sessionChanged())
    if (refreshing) return refreshing
    const started = epoch
    refreshing = deps.lock(async () => {
      if (blocked || started !== epoch) throw sessionChanged()
      if (Date.now() < refreshRetryAt) throw Object.assign(new Error("Refresh throttled"), { isAxiosError: true, response: { status: 429, headers: { "retry-after": String(Math.ceil((refreshRetryAt - Date.now()) / 1000)) }, data: {} } })
      try {
        const session = await deps.transport.refresh()
        if (blocked || started !== epoch) throw sessionChanged()
        deps.receive(session); return session
      } catch (error) {
        if (started === epoch) {
          const failure = authFailure(error)
          if (failure.retryAt) refreshRetryAt = failure.retryAt
          // A server/network outage is not proof that the session was revoked.
          if (failure.status === 401) invalidate()
        }
        throw error
      }
    }).finally(() => { refreshing = null })
    return refreshing
  }
  async function performLogin(body: LoginRequest) {
    const started = ++epoch
    blocked = true
    await refreshing?.catch(() => undefined)
    return deps.lock(async () => {
      if (started !== epoch) throw sessionChanged()
      const session = await deps.transport.login(body)
      if (started !== epoch) throw sessionChanged()
      blocked = false; refreshRetryAt = 0; deps.receive(session); deps.broadcast("login")
      return session
    })
  }
  function login(body: LoginRequest): Promise<AuthSession> {
    if (signingIn) return signingIn
    signingIn = performLogin(body).finally(() => { signingIn = null })
    return signingIn
  }
  function end(): Promise<void> {
    if (ending) return ending
    invalidate(true)
    // Logout participates in the same cross-tab lock as rotation, including cookie writes.
    ending = (async () => {
      await refreshing?.catch(() => undefined)
      await signingIn?.catch(() => undefined)
      await deps.lock(() => deps.transport.logout())
    })().finally(() => { ending = null })
    return ending
  }
  function external(event: "logout" | "login") {
    invalidate()
    // A login in another tab changes the cookie identity. Never retain the old user's cache.
    if (event === "login") blocked = false
  }
  return { refresh, login, end, invalidate, external, getEpoch: () => epoch, isBlocked: () => blocked }
}
