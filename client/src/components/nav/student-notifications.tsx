import { useState } from "react"
import { Bell, CheckCheck } from "lucide-react"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { studentNotifications } from "@/pages/mahasiswa/Notifikasi/notification-data"

function NotificationList({
  notifications,
  onRead,
  onReadAll,
  onNavigate,
  showAll = false,
}: {
  notifications: typeof studentNotifications
  onRead: (id: string) => void
  onReadAll: () => void
  onNavigate?: () => void
  showAll?: boolean
}) {
  const unreadCount = notifications.filter((item) => item.unread).length
  const visible = showAll ? notifications : notifications.slice(0, 5)

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3.5">
        <div>
          <h2 className="font-semibold">Notifikasi</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{unreadCount} belum dibaca</p>
        </div>
        {unreadCount > 0 && <Button type="button" variant="ghost" size="sm" onClick={onReadAll} className="h-8 shrink-0 px-2 text-xs text-primary"><CheckCheck />Tandai semua dibaca</Button>}
      </div>
      <div className={cn("divide-y", showAll && "rounded-xl border bg-card")}>
        {visible.map((notification) => (
          <Link
            key={notification.id}
            to={notification.href}
            onClick={() => { onRead(notification.id); onNavigate?.() }}
            className={cn("flex min-h-20 items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring", notification.unread && "bg-primary/[0.045]")}
          >
            <span className="mt-1.5 flex size-2.5 shrink-0 items-center justify-center">
              {notification.unread && <span className="size-2 rounded-full bg-primary" aria-label="Belum dibaca" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{notification.category}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">{notification.time}</span>
              </span>
              <span className="mt-1 block text-sm font-medium leading-snug">{notification.title}</span>
              <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-muted-foreground">{notification.message}</span>
            </span>
          </Link>
        ))}
      </div>
      {!showAll && <Link to="/mahasiswa/notifikasi" onClick={onNavigate} className="block border-t px-4 py-3 text-center text-sm font-medium text-primary hover:bg-muted/60">Lihat Semua Notifikasi</Link>}
    </>
  )
}

export function StudentNotifications() {
  const isMobile = useIsMobile()
  const [notifications, setNotifications] = useState(studentNotifications)
  const [open, setOpen] = useState(false)
  const unreadCount = notifications.filter((item) => item.unread).length
  const markRead = (id: string) => setNotifications((current) => current.map((item) => item.id === id ? { ...item, unread: false } : item))
  const markAllRead = () => setNotifications((current) => current.map((item) => ({ ...item, unread: false })))
  const trigger = (
    <Button type="button" variant="ghost" size="icon" aria-label={`Notifikasi, ${unreadCount} belum dibaca`} className="relative size-10 shrink-0 rounded-xl">
      <Bell className="size-[18px]" />
      {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">{unreadCount > 9 ? "9+" : unreadCount}</span>}
    </Button>
  )

  if (isMobile) return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger} />
      <SheetContent side="bottom" showCloseButton className="max-h-[82dvh] gap-0 overflow-hidden rounded-t-2xl p-0 pb-[env(safe-area-inset-bottom)]">
        <SheetHeader className="sr-only"><SheetTitle>Notifikasi</SheetTitle></SheetHeader>
        <div className="overflow-y-auto"><NotificationList notifications={notifications} onRead={markRead} onReadAll={markAllRead} onNavigate={() => setOpen(false)} /></div>
      </SheetContent>
    </Sheet>
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" sideOffset={10} className="w-[min(24rem,calc(100vw-1rem))] gap-0 overflow-hidden rounded-xl p-0 shadow-xl">
        <NotificationList notifications={notifications} onRead={markRead} onReadAll={markAllRead} onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

export function StudentNotificationListPage() {
  const [notifications, setNotifications] = useState(studentNotifications)
  const unreadCount = notifications.filter((item) => item.unread).length
  const markRead = (id: string) => setNotifications((current) => current.map((item) => item.id === id ? { ...item, unread: false } : item))
  const markAllRead = () => setNotifications((current) => current.map((item) => ({ ...item, unread: false })))

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 py-5 pb-28 sm:py-7 md:pb-7">
      <header className="flex items-start justify-between gap-4">
        <div><p className="text-sm font-medium text-primary">Pusat informasi</p><h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Notifikasi</h1><p className="mt-2 text-sm text-muted-foreground">Pembaruan penting seputar aktivitas akademik dan pembayaranmu.</p></div>
        {unreadCount > 0 && <Button type="button" variant="outline" size="sm" onClick={markAllRead} className="shrink-0"><CheckCheck />Tandai semua dibaca</Button>}
      </header>
      <p className="text-sm text-muted-foreground">{unreadCount} belum dibaca</p>
      <NotificationList notifications={notifications} onRead={markRead} onReadAll={markAllRead} showAll />
    </main>
  )
}

export default StudentNotificationListPage
