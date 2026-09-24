import { useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { changePassword, logoutApi } from "@/features/action/authThunk"
import { validatePassword } from "@/api/auth-errors"
import { useRetryAfter } from "@/hooks/use-retry-after"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
export default function PasswordChange() {
  const dispatch = useAppDispatch()
  const { changingPassword, passwordError, loggingOut } = useAppSelector(state => state.auth)
  const [validation, setValidation] = useState<string | null>(null)
  const seconds = useRetryAfter(passwordError?.retryAt)
  const pending = useRef(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || seconds) return
    const form = new FormData(event.currentTarget)
    const currentPassword = String(form.get('currentPassword') ?? '')
    const newPassword = String(form.get('newPassword') ?? '')
    const error = validatePassword(currentPassword, newPassword, String(form.get('confirmPassword') ?? ''))
    setValidation(error); if (error) return
    pending.current = true
    try { await dispatch(changePassword({ currentPassword, newPassword })).unwrap(); toast.success("Password berhasil diubah. Silakan login kembali.") }
    catch { /* Backend errors are rendered from Redux, without logging credentials. */ }
    finally { pending.current = false }
  }
  return <main className="mx-auto max-w-md space-y-4 p-8"><h1 className="text-xl font-semibold">Ganti password</h1><p className="text-sm text-muted-foreground">Ganti password sementara sebelum melanjutkan. Setelah berhasil, seluruh sesi dicabut dan Anda harus login kembali.</p>
    <form onSubmit={submit} className="space-y-4"><fieldset disabled={changingPassword || loggingOut} className="space-y-4">
      <label className="block space-y-2">Password saat ini<Input name="currentPassword" type="password" autoComplete="current-password" required /></label>
      <label className="block space-y-2">Password baru<Input name="newPassword" type="password" autoComplete="new-password" required /></label>
      <p className="text-xs text-muted-foreground">Minimal 12 karakter, maksimal 72 byte UTF-8.</p>
      <label className="block space-y-2">Konfirmasi password<Input name="confirmPassword" type="password" autoComplete="new-password" required /></label>
      {(validation || passwordError) && <p role="alert" className="text-sm text-destructive">{validation ?? passwordError?.message}</p>}
      <Button type="submit" disabled={changingPassword || seconds > 0}>{changingPassword ? "Menyimpan..." : seconds ? `Tunggu ${seconds} detik` : "Simpan password"}</Button>
    </fieldset></form><Button variant="outline" disabled={changingPassword || loggingOut} onClick={() => dispatch(logoutApi())}>Keluar</Button>
  </main>
}
