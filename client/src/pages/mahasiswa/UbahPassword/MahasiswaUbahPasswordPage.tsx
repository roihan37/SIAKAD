import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, ShieldCheck, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
  newPassword: z.string()
    .min(8, "Password baru minimal 8 karakter.")
    .regex(/[A-Z]/, "Tambahkan minimal satu huruf besar.")
    .regex(/[a-z]/, "Tambahkan minimal satu huruf kecil.")
    .regex(/[0-9]/, "Tambahkan minimal satu angka."),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: "Konfirmasi password belum sama.",
  path: ["confirmPassword"],
})

type PasswordFormValues = z.infer<typeof passwordSchema>

const requirements = [
  { label: "Minimal 8 karakter", test: (value: string) => value.length >= 8 },
  { label: "Huruf besar", test: (value: string) => /[A-Z]/.test(value) },
  { label: "Huruf kecil", test: (value: string) => /[a-z]/.test(value) },
  { label: "Angka", test: (value: string) => /[0-9]/.test(value) },
]

function PasswordField({
  id,
  label,
  value,
  error,
  autoComplete,
  onChange,
  onBlur,
  name,
  inputRef,
}: {
  id: string
  label: string
  value: string
  error?: string
  autoComplete: string
  name: "currentPassword" | "newPassword" | "confirmPassword"
  onChange: React.ChangeEventHandler<HTMLInputElement>
  onBlur: React.FocusEventHandler<HTMLInputElement>
  inputRef: React.Ref<HTMLInputElement>
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          ref={inputRef}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-11 rounded-xl pr-12"
        />
        <button
          type="button"
          aria-label={visible ? `Sembunyikan ${label.toLowerCase()}` : `Tampilkan ${label.toLowerCase()}`}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {error && <p id={`${id}-error`} role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

export default function MahasiswaUbahPasswordPage() {
  const [success, setSuccess] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const currentPassword = watch("currentPassword")
  const newPassword = watch("newPassword")
  const confirmPassword = watch("confirmPassword")
  const currentField = register("currentPassword")
  const newField = register("newPassword")
  const confirmField = register("confirmPassword")
  const requirementResults = useMemo(() => requirements.map((item) => ({ ...item, passed: item.test(newPassword ?? "") })), [newPassword])
  const passedCount = requirementResults.filter((item) => item.passed).length
  const strength = passedCount <= 1 ? "Lemah" : passedCount < requirements.length ? "Sedang" : "Kuat"
  const strengthWidth = `${(passedCount / requirements.length) * 100}%`
  const strengthColor = passedCount <= 1 ? "bg-destructive" : passedCount < requirements.length ? "bg-amber-500" : "bg-emerald-500"
  const passwordsMatch = Boolean(confirmPassword) && newPassword === confirmPassword

  async function onSubmit(values: PasswordFormValues) {
    setSuccess(false)
    clearErrors("currentPassword")

    // UI-only simulation: enter "salah" as the current password to preview the inline error state.
    await new Promise((resolve) => window.setTimeout(resolve, 850))
    if (values.currentPassword.trim().toLowerCase() === "salah") {
      setError("currentPassword", { type: "server", message: "Password saat ini tidak sesuai. Coba periksa kembali." })
      return
    }

    reset()
    setSuccess(true)
    toast.success("Password berhasil diperbarui", { description: "Simulasi berhasil. Perubahan belum disimpan ke akun." })
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 pb-28 md:space-y-8 md:pb-8">
      <header>
        <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="size-5" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Ubah Password</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Buat password yang kuat untuk menjaga keamanan akun akademikmu.
        </p>
      </header>

      <Card className="rounded-2xl">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Keamanan akun</CardTitle>
          <CardDescription>Gunakan password unik yang tidak kamu pakai di layanan lain.</CardDescription>
        </CardHeader>
        <CardContent className="pt-5 sm:pt-6">
          {success && (
            <div role="status" className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-medium text-foreground">Password berhasil diperbarui</p>
                <p className="mt-1 text-muted-foreground">Form sudah direset. Ini hanya konfirmasi simulasi; password akun tidak benar-benar berubah.</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <PasswordField id="current-password" label="Password Saat Ini" autoComplete="current-password" value={currentPassword ?? ""} error={errors.currentPassword?.message} name={currentField.name} onChange={currentField.onChange} onBlur={currentField.onBlur} inputRef={currentField.ref} />

            <div className="space-y-4 rounded-xl border bg-muted/20 p-4 sm:p-5">
              <PasswordField id="new-password" label="Password Baru" autoComplete="new-password" value={newPassword ?? ""} error={errors.newPassword?.message} name={newField.name} onChange={newField.onChange} onBlur={newField.onBlur} inputRef={newField.ref} />

              <section aria-label="Persyaratan password" className="space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Kekuatan password</span>
                  <span className="font-medium">{strength}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`Kekuatan password: ${strength}`} aria-valuemin={0} aria-valuemax={4} aria-valuenow={passedCount}>
                  <div className={`h-full rounded-full transition-all ${strengthColor}`} style={{ width: strengthWidth }} />
                </div>
                <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {requirementResults.map((item) => (
                    <li key={item.label} className={`flex items-center gap-2 ${item.passed ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                      {item.passed ? <Check className="size-4" /> : <span className="size-4 rounded-full border" aria-hidden="true" />}
                      {item.label}
                    </li>
                  ))}
                </ul>
              </section>

              <PasswordField id="confirm-password" label="Konfirmasi Password Baru" autoComplete="new-password" value={confirmPassword ?? ""} error={errors.confirmPassword?.message} name={confirmField.name} onChange={confirmField.onChange} onBlur={confirmField.onBlur} inputRef={confirmField.ref} />
              {confirmPassword && !errors.confirmPassword && (
                <p className={`flex items-center gap-2 text-sm ${passwordsMatch ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`} aria-live="polite">
                  {passwordsMatch ? <Check className="size-4" /> : <X className="size-4" />}
                  {passwordsMatch ? "Password sudah cocok." : "Konfirmasi password belum sama."}
                </p>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-muted-foreground">Simulasi UI — password tidak dikirim atau disimpan.</p>
              <Button type="submit" disabled={!isValid || isSubmitting} className="h-11 w-full rounded-xl sm:w-auto sm:min-w-40">
                {isSubmitting ? <><LoaderCircle className="animate-spin" /> Memproses...</> : "Ubah Password"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
