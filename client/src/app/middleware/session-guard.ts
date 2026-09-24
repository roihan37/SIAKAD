import { isAction, type Middleware } from "@reduxjs/toolkit"
import type { AuthState } from "@/features/slice/authSlice"
// Legacy slices also receive async results; reject responses belonging to an earlier identity.
export const sessionGuard: Middleware = store => {
  const pending = new Set<string>()
  const auth = () => (store.getState() as { auth: AuthState }).auth
  return next => action => {
    if (!isAction(action)) return next(action)
    const previous = auth()
    if (!action.type.startsWith("auth/")) {
      const meta = "meta" in action ? action.meta as { requestId?: string } : undefined
      if (meta?.requestId) {
        if (!previous.accessToken || previous.user?.role !== "Admin" || previous.user.mustChangePassword) return action
        if (action.type.endsWith("/pending")) pending.add(meta.requestId)
        else if ((action.type.endsWith("/fulfilled") || action.type.endsWith("/rejected")) && !pending.delete(meta.requestId)) return action
      }
    }
    const result = next(action)
    const current = auth()
    if (action.type === "auth/logoutLocal" || previous.user?.id !== current.user?.id || previous.user?.role !== current.user?.role || previous.user?.mustChangePassword !== current.user?.mustChangePassword) pending.clear()
    return result
  }
}
