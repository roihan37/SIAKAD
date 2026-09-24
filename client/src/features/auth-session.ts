import { createAction } from "@reduxjs/toolkit"
import type { AuthSession } from "@/types/auth"
export const sessionReceived = createAction<AuthSession>("auth/sessionReceived")
export const logout = createAction("auth/logoutLocal")
export const passwordChangeRequired = createAction("auth/passwordChangeRequired")
