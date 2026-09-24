import type { ReactNode } from "react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { refreshToken, logoutApi } from "@/features/action/authThunk"
import { useRetryAfter } from "@/hooks/use-retry-after"
import { Button } from "@/components/ui/button"
export function SessionGate({ children }: { children: ReactNode }) {
  const { initialized, recoveryError, refreshRequestId } = useAppSelector(state => state.auth)
  const dispatch = useAppDispatch()
  const seconds = useRetryAfter(recoveryError?.retryAt)
  if (initialized) return children
  return <main className="mx-auto max-w-md space-y-4 p-8" aria-busy={!!refreshRequestId}>
    {recoveryError ? <><h1 className="text-xl font-semibold">Sesi belum dapat diperiksa</h1><p role="alert" className="text-sm text-muted-foreground">{recoveryError.message}</p><Button disabled={seconds > 0 || !!refreshRequestId} onClick={() => dispatch(refreshToken())}>{seconds ? `Coba lagi dalam ${seconds} detik` : "Coba Lagi"}</Button><Button variant="outline" onClick={() => dispatch(logoutApi())}>Keluar dari sesi</Button></> : <p role="status">Memeriksa sesi...</p>}
  </main>
}
