import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Eye, EyeOff, KeyRound, LoaderCircle, ShieldCheck, X } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { finishPasswordChange } from "@/api/axios"
import { validatePassword } from "@/api/auth-errors"
import { changeStudentPassword, studentProfileErrorMessage } from "@/api/student-profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi."),
  newPassword: z.string(),
  confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
}).superRefine((values, context) => {
  const message = validatePassword(values.currentPassword, values.newPassword, values.confirmPassword)
  if (!message) return
  context.addIssue({
    code: "custom",
    message,
    path: message.startsWith("Konfirmasi") ? ["confirmPassword"] : ["newPassword"],
  })
})

type PasswordFormValues = z.infer<typeof passwordSchema>

const utf8Length = (value: string) => new TextEncoder().encode(value).length

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
  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isValid },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const [currentPassword, newPassword, confirmPassword] = useWatch({
    control,
    name: ["currentPassword", "newPassword", "confirmPassword"],
  })
  const currentField = register("currentPassword")
  const newField = register("newPassword")
  const confirmField = register("confirmPassword")
  const requirements = useMemo(() => [
    { label: "Minimal 12 karakter", passed: [...(newPassword ?? "")].length >= 12 },
    { label: "Maksimal 72 byte", passed: utf8Length(newPassword ?? "") <= 72 },
    { label: "Berbeda dari password saat ini", passed: Boolean(newPassword) && newPassword !== currentPassword },
  ], [currentPassword, newPassword])
  const passwordsMatch = Boolean(confirmPassword) && newPassword === confirmPassword

  async function onSubmit(values: PasswordFormValues) {
    clearErrors("currentPassword")
    try {
      await changeStudentPassword({ currentPassword: values.currentPassword, newPassword: values.newPassword })
      toast.success("Password berhasil diperbarui", { description: "Silakan masuk kembali menggunakan password baru." })
      finishPasswordChange()
    } catch (error) {
      const message = studentProfileErrorMessage(error, "Password belum dapat diperbarui.")
      setError("currentPassword", { type: "server", message })
      toast.error(message)
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
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
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <PasswordField id="current-password" label="Password Saat Ini" autoComplete="current-password" value={currentPassword ?? ""} error={errors.currentPassword?.message} name={currentField.name} onChange={currentField.onChange} onBlur={currentField.onBlur} inputRef={currentField.ref} />

            <div className="space-y-4 rounded-xl border bg-muted/20 p-4 sm:p-5">
              <PasswordField id="new-password" label="Password Baru" autoComplete="new-password" value={newPassword ?? ""} error={errors.newPassword?.message} name={newField.name} onChange={newField.onChange} onBlur={newField.onBlur} inputRef={newField.ref} />

              <section aria-label="Persyaratan password" className="space-y-3">
                <p className="text-sm font-medium">Persyaratan password</p>
                <ul className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {requirements.map((item) => (
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
              <p className="text-xs leading-5 text-muted-foreground">Setelah berhasil, seluruh sesi akun akan diakhiri dan kamu perlu masuk kembali.</p>
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
