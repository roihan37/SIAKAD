import { useEffect, useRef, useState, type FormEvent } from "react"
import { Link } from "react-router"
import {
  AlertCircle,
  ArrowRight,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  History,
  MapPin,
  MessageSquarePlus,
  RefreshCw,
  Send,
  Sparkles,
  UserCheck,
  WalletCards,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import {
  assistantReplies,
  conversationHistory,
  inferTopic,
  quickPrompts,
  studentAssistantProfile,
  topicPrompts,
  type AssistantTopic,
  type ConversationMessage,
} from "./ai-assistant-data"

const topicMeta: Record<AssistantTopic, { label: string; icon: typeof CalendarDays; source: string; path: string; action: string }> = {
  schedule: { label: "Jadwal hari ini", icon: CalendarDays, source: "Jadwal Kuliah · Semester Ganjil 2026/2027", path: "/mahasiswa/jadwal-kuliah", action: "Lihat Jadwal" },
  krs: { label: "Status KRS", icon: FileCheck2, source: "Kartu Rencana Studi · Semester Ganjil 2026/2027", path: "/mahasiswa/krs", action: "Lihat KRS" },
  grade: { label: "Ringkasan akademik", icon: GraduationCap, source: "Nilai & KHS · Data sampai Semester Genap 2025/2026", path: "/mahasiswa/nilai-khs", action: "Lihat Nilai" },
  attendance: { label: "Ringkasan presensi", icon: UserCheck, source: "Presensi · Semester Ganjil 2026/2027", path: "/mahasiswa/presensi", action: "Lihat Presensi" },
  tuition: { label: "Status pembayaran", icon: WalletCards, source: "Tagihan UKT · Semester Ganjil 2026/2027", path: "/mahasiswa/tagihan-ukt", action: "Lihat UKT" },
  announcement: { label: "Pengumuman terbaru", icon: Bell, source: "Pengumuman akademik · Diperbarui hari ini", path: "/mahasiswa/pengumuman", action: "Lihat Pengumuman" },
}

function ContextCard({ topic }: { topic: AssistantTopic }) {
  const meta = topicMeta[topic]
  const Icon = meta.icon

  return (
    <Card className="mt-3 max-w-xl gap-3 border-primary/10 py-4 ring-primary/15">
      <CardContent className="space-y-4 px-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
            <div><p className="font-semibold">{meta.label}</p><p className="mt-0.5 text-xs text-muted-foreground">Data akademik personal</p></div>
          </div>
          <Badge variant="secondary">Dummy</Badge>
        </div>

        {topic === "schedule" && <div className="space-y-2">
          {[
            ["08.00–09.40", "Interaksi Manusia & Komputer", "Lab Komputasi 1"],
            ["10.00–11.40", "Kecerdasan Buatan", "Lab Komputasi 2"],
            ["13.00–14.40", "Manajemen Proyek TI", "Ruang B-203"],
          ].map(([time, course, room], index) => <div key={course} className="flex gap-3 rounded-xl border bg-muted/20 p-3">
            <div className="w-20 shrink-0"><p className="text-xs font-semibold tabular-nums text-primary">{time}</p>{index === 1 && <Badge className="mt-1 h-auto px-1.5 py-0 text-[9px]">Berikutnya</Badge>}</div>
            <div className="min-w-0"><p className="text-sm font-medium leading-5">{course}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3" />{room}</p></div>
          </div>)}
        </div>}

        {topic === "krs" && <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Status</p><p className="mt-1 flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-4" />Disetujui</p></div>
          <div className="rounded-xl border bg-muted/20 p-3"><p className="text-xs text-muted-foreground">Total studi</p><p className="mt-1 text-lg font-semibold">21 <span className="text-sm font-normal text-muted-foreground">SKS</span></p></div>
        </div>}

        {topic === "grade" && <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[{ label: "IPK", value: "3,72" }, { label: "SKS", value: "92" }, { label: "IPS terakhir", value: "3,81" }].map((item) => <div key={item.label} className="rounded-xl border bg-muted/20 p-3"><p className="text-[11px] text-muted-foreground">{item.label}</p><p className="mt-1 text-lg font-semibold">{item.value}</p></div>)}
        </div>}

        {topic === "attendance" && <div className="rounded-xl border bg-muted/20 p-3">
          <div className="flex items-end justify-between"><div><p className="text-xs text-muted-foreground">Kehadiran keseluruhan</p><p className="mt-1 text-xl font-semibold">94%</p></div><p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Aman</p></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full w-[94%] rounded-full bg-emerald-600" /></div>
        </div>}

        {topic === "tuition" && <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-600" /><div><p className="font-semibold text-emerald-800 dark:text-emerald-200">Lunas</p><p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">Rp5.500.000 · Semester Ganjil 2026/2027</p></div>
        </div>}

        {topic === "announcement" && <div className="space-y-2">
          {["Pendaftaran Seminar Proposal dibuka hingga 16 Oktober", "Pemeliharaan portal pada Sabtu, 22.00–23.30 WIB"].map((item) => <div key={item} className="flex items-start gap-2 rounded-xl border bg-muted/20 p-3 text-sm leading-5"><Bell className="mt-0.5 size-4 shrink-0 text-primary" />{item}</div>)}
        </div>}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <p className="text-[11px] leading-4 text-muted-foreground">Sumber: {meta.source}</p>
          <Button nativeButton={false} variant="ghost" size="sm" render={<Link to={meta.path} />}>{meta.action}<ArrowRight /></Button>
        </div>
      </CardContent>
    </Card>
  )
}

function AssistantMessage({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "user"
  return <article className={cn("flex gap-3", isUser && "justify-end")}>
    {!isUser && <Avatar className="mt-0.5 size-8 border"><AvatarFallback className="bg-primary text-primary-foreground"><Sparkles className="size-4" /></AvatarFallback></Avatar>}
    <div className={cn("min-w-0 max-w-[88%] sm:max-w-2xl", isUser && "rounded-2xl rounded-br-md bg-primary px-4 py-3 text-primary-foreground")}>
      {!isUser && <p className="mb-1 text-xs font-semibold text-primary">SIAKAD AI</p>}
      <p className="text-sm leading-6">{message.text}</p>
      {!isUser && message.topic && <ContextCard topic={message.topic} />}
      <time className={cn("mt-1.5 block text-[10px]", isUser ? "text-primary-foreground/70" : "text-muted-foreground")}>{message.createdAt}</time>
    </div>
  </article>
}

function LoadingMessage() {
  return <div className="flex gap-3" aria-live="polite"><Avatar className="size-8 border"><AvatarFallback className="bg-primary text-primary-foreground"><Sparkles className="size-4" /></AvatarFallback></Avatar><div className="rounded-2xl border bg-card px-4 py-3"><div className="flex items-center gap-1.5"><span className="size-1.5 animate-pulse rounded-full bg-primary" /><span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:150ms]" /><span className="size-1.5 animate-pulse rounded-full bg-primary [animation-delay:300ms]" /><span className="ml-1 text-xs text-muted-foreground">Mencari data akademikmu…</span></div></div></div>
}

export default function MahasiswaAIAssistantPage() {
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const responseTimer = useRef<number | null>(null)

  useEffect(() => () => {
    if (responseTimer.current !== null) window.clearTimeout(responseTimer.current)
  }, [])

  const sendMessage = (value: string) => {
    const prompt = value.trim()
    if (!prompt || loading) return
    setInput("")
    setError(false)
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text: prompt, createdAt: "Baru saja" }])
    setLoading(true)
    responseTimer.current = window.setTimeout(() => {
      const topic = inferTopic(prompt)
      if (!topic) {
        responseTimer.current = null
        setError(true)
        setLoading(false)
        return
      }
      setMessages((current) => [...current, { id: `assistant-${Date.now()}`, role: "assistant", text: assistantReplies[topic], topic, createdAt: "Baru saja" }])
      setLoading(false)
      responseTimer.current = null
    }, 700)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    sendMessage(input)
  }

  const startNewChat = () => {
    if (responseTimer.current !== null) window.clearTimeout(responseTimer.current)
    responseTimer.current = null
    setMessages([])
    setInput("")
    setLoading(false)
    setError(false)
  }

  const openHistory = (topic: AssistantTopic) => {
    if (responseTimer.current !== null) window.clearTimeout(responseTimer.current)
    responseTimer.current = null
    setLoading(false)
    setError(false)
    setMessages([
      { id: `history-user-${topic}`, role: "user", text: topicPrompts[topic], createdAt: "Percakapan sebelumnya" },
      { id: `history-assistant-${topic}`, role: "assistant", text: assistantReplies[topic], topic, createdAt: "Percakapan sebelumnya" },
    ])
    setHistoryOpen(false)
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col py-4 pb-0 sm:py-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm"><Bot className="size-5" aria-hidden="true" /></span>
          <div><div className="flex items-center gap-2"><h1 className="text-xl font-semibold tracking-tight sm:text-2xl">AI Assistant</h1><Badge variant="secondary">Demo</Badge></div><p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">Asisten akademik pribadi · Data dummy</p></div>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setHistoryOpen(true)}><History />Riwayat</Button>
          <Button type="button" size="sm" onClick={startNewChat}><MessageSquarePlus />New Chat</Button>
        </div>
      </header>

      <section aria-label="Percakapan AI Assistant" className="flex-1 py-5 sm:py-7">
        {messages.length === 0 ? <div className="mx-auto flex max-w-3xl flex-col items-center py-5 text-center sm:py-10">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="size-7" aria-hidden="true" /></span>
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">Halo, {studentAssistantProfile.firstName}!</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Saya siap membantu membaca informasi akademikmu sebagai mahasiswa {studentAssistantProfile.program} semester {studentAssistantProfile.semester}. Mau cek apa hari ini?</p>
          <div className="mt-7 grid w-full grid-cols-2 gap-2.5 sm:grid-cols-3">
            {quickPrompts.map((item) => {
              const Icon = topicMeta[item.topic].icon
              return <button key={item.topic} type="button" onClick={() => sendMessage(item.prompt)} className="group flex min-h-20 items-center gap-3 rounded-2xl border bg-card p-3 text-left transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground group-hover:text-primary"><Icon className="size-[18px]" aria-hidden="true" /></span><span className="text-sm font-medium leading-5">{item.label}</span>
              </button>
            })}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">AI dapat keliru. Konfirmasi keputusan akademik melalui halaman sumber terkait.</p>
        </div> : <div className="space-y-6">
          {messages.map((message) => <AssistantMessage key={message.id} message={message} />)}
          {loading && <LoadingMessage />}
          {error && <Alert variant="destructive" className="ml-11 max-w-xl"><AlertCircle /><AlertTitle>Pertanyaan belum dapat diproses</AlertTitle><AlertDescription className="space-y-2"><p>Coba tanyakan topik akademik seperti jadwal, KRS, nilai, presensi, UKT, atau pengumuman.</p><Button type="button" variant="outline" size="sm" onClick={() => { setError(false); setInput("Apa jadwal kuliah saya hari ini?") }}><RefreshCw />Gunakan Contoh</Button></AlertDescription></Alert>}
        </div>}
      </section>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 -mx-4 border-t bg-background/95 px-4 pt-3 pb-2 backdrop-blur md:bottom-0 md:mx-0 md:rounded-t-2xl md:border md:px-3">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-4xl items-end gap-2">
          <Textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(input) } }} rows={1} disabled={loading} aria-label="Pesan untuk AI Assistant" placeholder="Tanyakan jadwal, KRS, nilai, presensi, atau UKT…" className="max-h-32 min-h-11 resize-none rounded-xl bg-background px-3 py-3 text-sm" />
          <Button type="submit" size="icon-lg" disabled={!input.trim() || loading} aria-label="Kirim pesan" className="size-11 rounded-xl"><Send className="size-4" /></Button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground"><Clock3 className="mr-1 inline size-3" />Respons demo menggunakan data akademik dummy.</p>
      </div>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
          <SheetHeader className="border-b px-5 py-5"><SheetTitle>Riwayat Percakapan</SheetTitle><SheetDescription>Pilih percakapan untuk melanjutkan konteks sebelumnya.</SheetDescription></SheetHeader>
          <div className="space-y-2 p-4">
            {conversationHistory.map((item) => <button key={item.id} type="button" onClick={() => openHistory(item.topic)} className="w-full rounded-xl border p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <div className="flex items-start justify-between gap-3"><p className="font-medium">{item.title}</p><span className="shrink-0 text-[10px] text-muted-foreground">{item.date}</span></div><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.preview}</p>
            </button>)}
          </div>
        </SheetContent>
      </Sheet>
    </main>
  )
}
