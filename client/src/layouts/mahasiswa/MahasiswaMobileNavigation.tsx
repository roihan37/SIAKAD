import { useState } from "react"
import { Link, useLocation } from "react-router"
import { ChevronRight, Grid2X2, X } from "lucide-react"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { mahasiswaNavigation } from "@/navigation/mahasiswa-navigation"
import { navigationIcons } from "@/navigation/navigation-icons"
import { cn } from "@/lib/utils"

const basePath = "/mahasiswa"
const primaryPaths = ["dashboard", "jadwal-kuliah", "krs", "nilai-khs"]
const labels: Record<string, string> = {
  dashboard: "Beranda", "jadwal-kuliah": "Jadwal", krs: "KRS", "nilai-khs": "Nilai",
}
const primaryItems = mahasiswaNavigation.flatMap(group => group.items)
  .filter(item => primaryPaths.includes(item.path))
  .sort((a, b) => primaryPaths.indexOf(a.path) - primaryPaths.indexOf(b.path))
// Keep the mobile menu intentional when new desktop-only entries are added.
const morePaths = new Set([
  "presensi", "transkrip-nilai", "tagihan-ukt", "riwayat-pembayaran",
  "pengumuman", "ai-assistant", "skripsi", "profil", "ubah-password",
])
const moreGroups = mahasiswaNavigation.map(group => ({
  ...group, items: group.items.filter(item => morePaths.has(item.path)),
})).filter(group => group.items.length > 0)
const itemClass = "flex h-16 min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] leading-4 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
const activeClass = "bg-primary/5 text-primary"
const iconClass = "flex h-8 w-12 items-center justify-center rounded-full transition-colors motion-reduce:transition-none"

export function MahasiswaMobileNavigation() {
  const location = useLocation()
  // Tying the open state to the location also closes the panel on Back/Forward.
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === location.key
  const isActive = (path: string) => location.pathname === `${basePath}/${path}` || location.pathname.startsWith(`${basePath}/${path}/`)
  const moreActive = moreGroups.some(group => group.items.some(item => isActive(item.path)))

  return (
    <Sheet open={open} onOpenChange={value => setOpenAt(value ? location.key : null)}>
      <nav aria-label="Navigasi utama mahasiswa" className="fixed inset-x-0 bottom-0 z-40 flex w-full flex-row flex-nowrap items-stretch gap-1 border-t border-border/70 bg-background px-2 shadow-[0_-4px_20px_-12px_rgba(0,0,0,0.18)] pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] md:hidden">
          {primaryItems.map(item => {
            const Icon = navigationIcons[item.icon]
            return <Link key={item.path} to={`${basePath}/${item.path}`} aria-current={isActive(item.path) ? "page" : undefined} className={cn(itemClass, isActive(item.path) ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground")}>
              <span className={cn(iconClass, isActive(item.path) && "bg-primary/10")}><Icon className="size-5" strokeWidth={isActive(item.path) ? 2.2 : 1.8} aria-hidden="true" /></span><span>{labels[item.path]}</span>
            </Link>
          })}
          <SheetTrigger aria-label="Buka menu lainnya" className={cn(itemClass, open || moreActive ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground")}>
            <span className={cn(iconClass, (open || moreActive) && "bg-primary/10")}><Grid2X2 className="size-5" strokeWidth={open || moreActive ? 2.2 : 1.8} aria-hidden="true" /></span><span>Lainnya</span>
          </SheetTrigger>
      </nav>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[88dvh] gap-0 rounded-t-3xl border-border/70 bg-background pb-[env(safe-area-inset-bottom)] motion-reduce:transition-none">
        <div aria-hidden="true" className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/25" />
        <SheetHeader className="relative shrink-0 border-b border-border/60 px-5 pt-4 pb-5 pr-16">
          <SheetTitle className="text-lg font-semibold">Menu Lainnya</SheetTitle>
          <SheetDescription>Semua layanan kampus dalam satu tempat.</SheetDescription>
          <SheetClose aria-label="Tutup menu lainnya" className="absolute right-3 top-3 flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <X className="size-5" aria-hidden="true" />
          </SheetClose>
        </SheetHeader>
        <nav aria-label="Menu lainnya mahasiswa" className="min-h-0 space-y-6 overflow-y-auto overscroll-contain px-5 pt-5 pb-6">
          {moreGroups.map(group => <section key={group.label} aria-label={group.label}>
            <h2 className="mb-3 text-[11px] font-semibold tracking-wider text-muted-foreground">{group.label}</h2>
            <div className={cn("grid", group.label === "AKUN" ? "gap-1 rounded-2xl border border-border/70 bg-card p-1" : "grid-cols-2 gap-2.5")}>
              {group.items.map(item => {
                const Icon = navigationIcons[item.icon]
                return <Link key={item.path} to={`${basePath}/${item.path}`} onClick={() => setOpenAt(null)} aria-current={isActive(item.path) ? "page" : undefined} className={cn("group flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none", group.label === "AKUN" ? "min-h-14" : "min-h-20 border", isActive(item.path) ? `border-primary/20 ${activeClass}` : "border-border/70 bg-card hover:bg-muted/60")}>
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", isActive(item.path) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground group-hover:text-foreground")}>
                    <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 break-words text-[13px] leading-5">{item.title}</span>
                  {group.label === "AKUN" && <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                </Link>
              })}
            </div>
          </section>)}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
