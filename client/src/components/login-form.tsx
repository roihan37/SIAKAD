import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import React, { useRef, useState } from "react"
import { login, logoutApi } from "@/features/action/authThunk"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { useRetryAfter } from "@/hooks/use-retry-after"


// Development seed accounts only; authorization still comes from the login response.
const demoAccounts = import.meta.env.DEV ? [
  { label: "Admin", identifier: "admin", password: "Tasik123" },
  { label: "Dosen", identifier: "dosen0", password: "Tasik123" },
  { label: "Mahasiswa", identifier: "mahasiswa0", password: "Tasik123" },
] : []

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const dispatch = useAppDispatch();
  const { isLoading, error, logoutError, loggingOut } = useAppSelector(state => state.auth)
  const seconds = useRetryAfter(error?.retryAt)
  const logoutSeconds = useRetryAfter(logoutError?.retryAt)
  const pending = useRef(false)
  const [showPassword, setShowPassword] = useState(false)

  const [selectedDemo, setSelectedDemo] = useState(demoAccounts[0]?.identifier ?? "")
  const [loginForm, setLoginForm] = useState({
    identifier: demoAccounts[0]?.identifier ?? "",
    password: demoAccounts[0]?.password ?? "",
  })

  const selectDemoAccount = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const account = demoAccounts.find(item => item.identifier === event.target.value)
    if (!account) return
    setSelectedDemo(account.identifier)
    setLoginForm({ identifier: account.identifier, password: account.password })
  }

  const handleInput = ({ target } : React.ChangeEvent<HTMLInputElement>) => {

    setSelectedDemo("")
    setLoginForm({
      ...loginForm,
      [target.name] : target.value
    }) 
  }

  const submitLogin = async (e: React.SubmitEvent<Element>) => {
    e.preventDefault();
    if (pending.current || isLoading || loggingOut || seconds || logoutError) return
    pending.current = true
    try { await dispatch(login(loginForm)).unwrap() }
    catch { /* Display the sanitized backend error from Redux. */ }
    finally { pending.current = false }

  }

  return (
    <form onSubmit={submitLogin} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400">Selamat datang kembali</p>
          <h1 className="text-3xl font-semibold tracking-tight">Masuk ke SIAKAD</h1>
          <p className="text-sm leading-6 text-muted-foreground">Gunakan akun kampus Anda untuk mengakses layanan akademik.</p>
        </div>
        {import.meta.env.DEV && (
          <Field className="gap-2 rounded-xl border border-dashed bg-muted/40 p-4">
            <FieldLabel htmlFor="demo-account">Akun Pengujian <span className="ml-auto rounded bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">DEV</span></FieldLabel>
            <select
              id="demo-account"
              value={selectedDemo}
              onChange={selectDemoAccount}
              disabled={isLoading || loggingOut}
              aria-describedby="demo-account-description"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>Pilih akun pengujian</option>
              {demoAccounts.map(account => (
                <option key={account.identifier} value={account.identifier}>{account.label}</option>
              ))}
            </select>
            <p id="demo-account-description" className="text-xs text-muted-foreground">
              Akun demo otomatis terisi. Klik Masuk untuk melanjutkan.
            </p>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="email">Email atau username</FieldLabel>
          <Input id="email" name="identifier" value={loginForm.identifier} onChange={handleInput} placeholder="Masukkan email atau username" className="h-11 px-3" autoCapitalize="none" spellCheck={false} autoComplete="username" disabled={isLoading || loggingOut} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input id="password" name="password" value={loginForm.password} onChange={handleInput} type={showPassword ? "text" : "password"} placeholder="Masukkan password" className="h-11 pl-3 pr-12" autoComplete="current-password" disabled={isLoading || loggingOut} required />
            <button type="button" onClick={() => setShowPassword(value => !value)} disabled={isLoading || loggingOut} aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"} aria-pressed={showPassword} aria-controls="password" className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50">
              {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </Field>
        <Field>
          {error && <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm leading-5 text-destructive">{error.message}</p>}
          {logoutError && <div role="alert" className="space-y-2 text-sm text-destructive"><p>Sesi lokal sudah dihapus, tetapi logout server belum berhasil. {logoutError.message}</p><Button type="button" variant="outline" disabled={loggingOut || logoutSeconds > 0} onClick={() => dispatch(logoutApi())}>{logoutSeconds ? `Coba logout dalam ${logoutSeconds} detik` : "Coba Logout Lagi"}</Button></div>}
          <Button type="submit" className="h-11 gap-2" aria-busy={isLoading || loggingOut} disabled={isLoading || loggingOut || seconds > 0 || !!logoutError}>{(isLoading || loggingOut) && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}{isLoading ? "Sedang masuk..." : loggingOut ? "Keluar..." : seconds ? `Tunggu ${seconds} detik` : "Masuk"}{!isLoading && !loggingOut && !seconds && <ArrowRight className="size-4" aria-hidden="true" />}</Button>
        </Field>
      </FieldGroup>
      <p className="border-t pt-5 text-center text-xs leading-5 text-muted-foreground">Kesulitan masuk atau lupa password? Hubungi administrator kampus untuk bantuan akun.</p>
    </form>
  )
}
