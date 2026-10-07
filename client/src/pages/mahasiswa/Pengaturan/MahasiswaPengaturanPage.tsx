import { Link } from "react-router"
import { useState } from "react"
import { useTheme } from "next-themes"
import {
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  KeyRound,
  Languages,
  Megaphone,
  Monitor,
  Moon,
  Palette,
  Sun,
  WalletCards,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

type ThemeOption = "system" | "light" | "dark"
type NotificationKey = "announcements" | "schedule" | "krs" | "grades" | "tuition"
type NotificationPreferences = Record<NotificationKey, boolean>

const notificationStorageKey = "siakad-mahasiswa-notifications"
const defaultNotifications: NotificationPreferences = {
  announcements: true,
  schedule: true,
  krs: true,
  grades: true,
  tuition: true,
}

const themeOptions: { id: ThemeOption; label: string; description: string; icon: LucideIcon }[] = [
  { id: "system", label: "Sistem", description: "Ikuti perangkat", icon: Monitor },
  { id: "light", label: "Terang", description: "Selalu terang", icon: Sun },
  { id: "dark", label: "Gelap", description: "Nyaman di malam hari", icon: Moon },
]

const notificationOptions: { id: NotificationKey; title: string; description: string; icon: LucideIcon }[] = [
  { id: "announcements", title: "Pengumuman Kampus", description: "Informasi akademik dan kabar penting kampus.", icon: Megaphone },
  { id: "schedule", title: "Jadwal Kuliah", description: "Pengingat kelas dan perubahan jadwal.", icon: CalendarDays },
  { id: "krs", title: "KRS", description: "Periode, status pengajuan, dan persetujuan KRS.", icon: ClipboardList },
  { id: "grades", title: "Nilai", description: "Pemberitahuan saat nilai baru diumumkan.", icon: GraduationCap },
  { id: "tuition", title: "UKT", description: "Tagihan, tenggat, dan status pembayaran.", icon: WalletCards },
]

function readNotificationPreferences() {
  if (typeof window === "undefined") return defaultNotifications
  try {
    const stored = window.localStorage.getItem(notificationStorageKey)
    if (!stored) return defaultNotifications
    const parsed: unknown = JSON.parse(stored)
    if (!parsed || typeof parsed !== "object") return defaultNotifications
    const values = parsed as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(defaultNotifications).map(([key, fallback]) => [key, typeof values[key] === "boolean" ? values[key] : fallback]),
    ) as NotificationPreferences
  } catch {
    return defaultNotifications
  }
}

function SectionHeading({ id, icon: Icon, title, description }: { id: string; icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div>
        <h2 id={id} className="font-semibold">{title}</h2>
        <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export default function MahasiswaPengaturanPage() {
  const { theme = "system", setTheme } = useTheme()
  const [notifications, setNotifications] = useState(readNotificationPreferences)
  const selectedTheme: ThemeOption = theme === "light" || theme === "dark" ? theme : "system"

  function changeTheme(nextTheme: ThemeOption) {
    setTheme(nextTheme)
  }

  function changeNotification(key: NotificationKey, checked: boolean) {
    const nextPreferences = { ...notifications, [key]: checked }
    setNotifications(nextPreferences)
    try {
      window.localStorage.setItem(notificationStorageKey, JSON.stringify(nextPreferences))
    } catch {
      toast.error("Preferensi belum dapat disimpan di perangkat ini.")
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 pb-28 md:pb-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pengaturan</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
          Sesuaikan tampilan dan notifikasi SIAKAD sesuai kebutuhanmu.
        </p>
      </header>

      <section aria-labelledby="appearance-heading">
        <SectionHeading id="appearance-heading" icon={Palette} title="Tampilan" description="Pilih tema yang paling nyaman digunakan." />
        <div className="rounded-2xl border bg-card p-3 sm:p-4">
          <div role="radiogroup" aria-label="Tema tampilan" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {themeOptions.map((option) => {
              const Icon = option.icon
              const selected = selectedTheme === option.id
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => changeTheme(option.id)}
                  className={cn(
                    "flex min-h-16 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected ? "border-primary/40 bg-primary/5" : "border-border/70 hover:bg-muted/60",
                  )}
                >
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground", selected && "bg-primary/10 text-primary")}>
                    <Icon className="size-[18px]" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{option.label}</span>
                    <span className="block text-xs text-muted-foreground">{option.description}</span>
                  </span>
                  {selected && <Check className="size-4 shrink-0 text-primary" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section aria-labelledby="notifications-heading">
        <SectionHeading id="notifications-heading" icon={Bell} title="Notifikasi" description="Atur informasi yang ingin kamu terima." />
        <div className="divide-y rounded-2xl border bg-card">
          {notificationOptions.map((option) => {
            const Icon = option.icon
            const labelId = `notification-${option.id}`
            return (
              <div key={option.id} className="flex min-h-20 items-center gap-3 px-4 py-3 sm:px-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div id={labelId} className="min-w-0 flex-1 pr-2">
                  <p className="text-sm font-medium">{option.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground sm:text-sm">{option.description}</p>
                </div>
                <Switch checked={notifications[option.id]} onCheckedChange={(checked) => changeNotification(option.id, checked)} aria-labelledby={labelId} />
              </div>
            )
          })}
        </div>
        <p className="mt-2 px-1 text-xs text-muted-foreground">Mode dummy: preferensi notifikasi disimpan hanya di perangkat ini.</p>
      </section>

      <section aria-labelledby="language-heading">
        <SectionHeading id="language-heading" icon={Languages} title="Bahasa" description="Bahasa yang digunakan pada antarmuka." />
        <div className="flex min-h-18 items-center gap-3 rounded-2xl border bg-card px-4 py-3 sm:px-5">
          <Languages className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Bahasa Indonesia</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Bahasa lain belum tersedia.</p>
          </div>
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Aktif</span>
        </div>
      </section>

      <section aria-labelledby="security-heading">
        <SectionHeading id="security-heading" icon={KeyRound} title="Keamanan" description="Akses cepat untuk menjaga keamanan akunmu." />
        <Link
          to="/mahasiswa/ubah-password"
          className="group flex min-h-18 items-center gap-3 rounded-2xl border bg-card px-4 py-3 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:text-foreground">
            <KeyRound className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Ubah Password</p>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">Perbarui password akun secara berkala.</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </Link>
      </section>
    </main>
  )
}
