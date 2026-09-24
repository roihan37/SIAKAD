import { Button } from "@/components/ui/button"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { logoutApi } from "@/features/action/authThunk"
export default function PortalPendingPage() {
  const { user, loggingOut } = useAppSelector(state => state.auth)
  const dispatch = useAppDispatch()
  const knownRole = user?.role === "Mahasiswa" || user?.role === "Dosen"
  return <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-4 p-6">
    <p className="text-sm font-medium text-primary">SIAKAD</p>
    <h1 className="text-2xl font-semibold">{knownRole ? `Dashboard ${user.role}` : "Akses terbatas"}</h1>
    <p className="text-muted-foreground">{knownRole ? "Coming soon. Portal Anda sedang disiapkan." : "Role akun Anda belum memiliki portal yang tersedia."}</p>
    <Button className="self-start" variant="outline" disabled={loggingOut} onClick={() => dispatch(logoutApi())}>{loggingOut ? "Keluar..." : "Keluar"}</Button>
  </main>
}
