import { useMemo, useState } from "react"
import { Link } from "react-router"
import {
  Building2,
  CalendarDays,
  ChevronRight,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  FilterX,
  Inbox,
  Megaphone,
  Paperclip,
  Pin,
  Search,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  announcementCategories,
  announcements,
  type Announcement,
  type AnnouncementCategory,
} from "./announcement-data"

type CategoryFilter = (typeof announcementCategories)[number]

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
})

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
})

const categoryTone: Record<AnnouncementCategory, string> = {
  Akademik: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  Keuangan: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Kegiatan: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
  Umum: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
}

function CategoryBadge({ category }: { category: AnnouncementCategory }) {
  return <Badge variant="outline" className={categoryTone[category]}>{category}</Badge>
}

function AnnouncementCard({
  announcement,
  isUnread,
  onOpen,
}: {
  announcement: Announcement
  isUnread: boolean
  onOpen: () => void
}) {
  return (
    <Card className={cn(
      "group relative overflow-hidden transition-colors hover:border-primary/30",
      announcement.pinned && "border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20",
    )}>
      {announcement.pinned && <span className="absolute inset-y-0 left-0 w-1 bg-amber-400" aria-hidden="true" />}
      <CardContent className="space-y-3 pl-5">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={announcement.category} />
          {isUnread && <Badge variant="secondary" className="gap-1 text-primary"><span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />Baru</Badge>}
          {announcement.pinned && <span className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300"><Pin className="size-3" aria-hidden="true" />Disematkan</span>}
        </div>
        <div>
          <h3 className="text-base font-semibold leading-snug text-foreground sm:text-lg">{announcement.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{announcement.summary}</p>
        </div>
        {announcement.deadline && (
          <div className="flex items-start gap-2 rounded-lg bg-background/80 px-3 py-2 text-xs text-foreground">
            <Clock3 className="mt-0.5 size-3.5 shrink-0 text-amber-600" aria-hidden="true" />
            <span><span className="font-medium">Batas waktu:</span> {dateTimeFormatter.format(new Date(announcement.deadline))} WIB</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 border-t pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" aria-hidden="true" />{dateFormatter.format(new Date(announcement.publishedAt))}</span>
          <Button type="button" variant="ghost" size="sm" onClick={onOpen}>Lihat detail<ChevronRight /></Button>
        </div>
      </CardContent>
    </Card>
  )
}

function downloadAttachment(announcement: Announcement) {
  if (!announcement.attachment) return

  const content = [
    `Lampiran dummy: ${announcement.attachment.name}`,
    `Pengumuman: ${announcement.title}`,
    `Penerbit: ${announcement.publisher}`,
    "Dokumen ini hanya contoh antarmuka dan belum berasal dari layanan dokumen SIAKAD.",
  ].join("\n")
  const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `lampiran-${announcement.id}.txt`
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function MahasiswaPengumumanPage() {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<CategoryFilter>("Semua")
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<Set<string>>(() => new Set())

  const filteredAnnouncements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return announcements.filter((announcement) => {
      const matchesCategory = category === "Semua" || announcement.category === category
      const matchesQuery = !normalizedQuery || [announcement.title, announcement.summary, announcement.publisher, ...announcement.content]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
      return matchesCategory && matchesQuery
    })
  }, [category, query])

  const importantAnnouncements = filteredAnnouncements.filter((announcement) => announcement.pinned)
  const latestAnnouncements = filteredAnnouncements.filter((announcement) => !announcement.pinned)
  const unreadCount = announcements.filter((announcement) => announcement.unread && !readAnnouncementIds.has(announcement.id)).length
  const hasFilters = Boolean(query || category !== "Semua")

  const openAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setReadAnnouncementIds((current) => new Set(current).add(announcement.id))
  }

  const resetFilters = () => {
    setQuery("")
    setCategory("Semua")
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Informasi kampus</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Pengumuman</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Temukan informasi akademik, keuangan, dan kegiatan kampus beserta tindakan yang perlu kamu lakukan.</p>
        </div>
        {unreadCount > 0 && <Badge variant="secondary" className="mt-1 shrink-0 gap-1.5"><span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />{unreadCount} baru</Badge>}
      </header>

      <Card>
        <CardContent className="space-y-4">
          <label className="relative block">
            <span className="sr-only">Cari pengumuman</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari judul atau isi pengumuman" className="h-10 pl-9" />
          </label>
          <div className="-mx-1 overflow-x-auto px-1 pb-1" aria-label="Filter kategori pengumuman">
            <div className="flex w-max gap-2">
              {announcementCategories.map((item) => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={category === item ? "default" : "outline"}
                  className="rounded-full px-4"
                  aria-pressed={category === item}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Inbox className="size-6" aria-hidden="true" /></span>
            <h2 className="mt-4 font-semibold">Belum ada pengumuman</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Informasi terbaru dari kampus akan tampil di halaman ini.</p>
          </CardContent>
        </Card>
      ) : filteredAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><Search className="size-6" aria-hidden="true" /></span>
            <h2 className="mt-4 font-semibold">Pengumuman tidak ditemukan</h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Coba kata kunci lain atau tampilkan kembali semua kategori.</p>
            {hasFilters && <Button type="button" variant="outline" className="mt-4" onClick={resetFilters}><FilterX />Reset pencarian</Button>}
          </CardContent>
        </Card>
      ) : (
        <>
          {importantAnnouncements.length > 0 && (
            <section className="space-y-3" aria-labelledby="important-announcements">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><Pin className="size-4" aria-hidden="true" /></span>
                <div><h2 id="important-announcements" className="font-semibold">Penting</h2><p className="text-xs text-muted-foreground">Informasi yang perlu segera diperhatikan</p></div>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {importantAnnouncements.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} isUnread={Boolean(announcement.unread && !readAnnouncementIds.has(announcement.id))} onOpen={() => openAnnouncement(announcement)} />)}
              </div>
            </section>
          )}

          {latestAnnouncements.length > 0 && (
            <section className="space-y-3" aria-labelledby="latest-announcements">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Megaphone className="size-4" aria-hidden="true" /></span>
                <div><h2 id="latest-announcements" className="font-semibold">Pengumuman Terbaru</h2><p className="text-xs text-muted-foreground">Diperbarui berdasarkan tanggal terbit</p></div>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {latestAnnouncements.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} isUnread={Boolean(announcement.unread && !readAnnouncementIds.has(announcement.id))} onOpen={() => openAnnouncement(announcement)} />)}
              </div>
            </section>
          )}
        </>
      )}

      <Dialog open={Boolean(selectedAnnouncement)} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
        {selectedAnnouncement && (
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <CategoryBadge category={selectedAnnouncement.category} />
                {selectedAnnouncement.pinned && <Badge variant="secondary" className="gap-1"><Pin className="size-3" aria-hidden="true" />Penting</Badge>}
              </div>
              <DialogTitle className="pr-6 text-xl leading-snug">{selectedAnnouncement.title}</DialogTitle>
              <DialogDescription className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" aria-hidden="true" />{dateFormatter.format(new Date(selectedAnnouncement.publishedAt))}</span>
                <span className="inline-flex items-center gap-1.5"><Building2 className="size-3.5" aria-hidden="true" />{selectedAnnouncement.publisher}</span>
              </DialogDescription>
            </DialogHeader>

            {selectedAnnouncement.deadline && (
              <div className={cn(
                "flex items-start gap-3 rounded-xl border p-3",
                selectedAnnouncement.action?.expired
                  ? "border-muted bg-muted/50 text-muted-foreground"
                  : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
              )}>
                <Clock3 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <div className="text-sm"><p className="font-medium">{selectedAnnouncement.action?.expired ? "Batas waktu telah berakhir" : "Batas waktu"}</p><p className="mt-0.5 text-xs opacity-80">{dateTimeFormatter.format(new Date(selectedAnnouncement.deadline))} WIB</p></div>
              </div>
            )}

            <div className="space-y-3 text-sm leading-7 text-foreground">
              {selectedAnnouncement.content.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>

            {selectedAnnouncement.attachment && (
              <Card className="bg-muted/30">
                <CardHeader className="border-b py-3"><CardTitle className="flex items-center gap-2 text-sm"><Paperclip className="size-4 text-primary" aria-hidden="true" />Lampiran</CardTitle></CardHeader>
                <CardContent className="flex items-center gap-3 py-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary"><FileText className="size-4" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{selectedAnnouncement.attachment.name}</p><p className="text-xs text-muted-foreground">{selectedAnnouncement.attachment.size} · Dokumen contoh</p></div>
                  <Button type="button" variant="outline" size="icon" aria-label={`Unduh ${selectedAnnouncement.attachment.name}`} onClick={() => downloadAttachment(selectedAnnouncement)}><Download /></Button>
                </CardContent>
              </Card>
            )}

            {selectedAnnouncement.action?.expired && <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Tindakan untuk pengumuman ini sudah tidak tersedia karena batas waktu telah berakhir.</p>}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setSelectedAnnouncement(null)}>Tutup</Button>
              {selectedAnnouncement.action && !selectedAnnouncement.action.expired && (
                <Button nativeButton={false} render={<Link to={selectedAnnouncement.action.path} />} onClick={() => setSelectedAnnouncement(null)}>
                  {selectedAnnouncement.action.label}<ExternalLink />
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </main>
  )
}
