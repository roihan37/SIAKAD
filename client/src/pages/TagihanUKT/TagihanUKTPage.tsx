import { useState } from "react"
import { Ban, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Plus, ReceiptText, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { AcademicSelect } from "@/components/academic/AcademicSelect"
import { BillingDialog, type BillingAction, type BillingChange } from "./BillingDialogs"
import { BillingDetailSheet } from "./BillingDetailSheet"
import { BillingTable } from "./BillingTable"
import { canCancel, canEdit, createBills, exportBills, money, periods, relativeDate, remaining, statusOf, statuses, students, today } from "./billing-data"
const initialFilters = { search: "", prodi: "Semua", angkatan: "Semua", status: "Semua", due: "Semua" }
const pageSize = 10
export default function TagihanUKTPage() {
  const [bills, setBills] = useState(createBills)
  const [period, setPeriod] = useState(periods[0])
  const [filters, setFilters] = useState(initialFilters)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [action, setAction] = useState<BillingAction | null>(null)
  const [detail, setDetail] = useState<{ id: string; payments: boolean } | null>(null)
  const changeFilter = (key: keyof typeof filters, value: string) => { setFilters({ ...filters, [key]: value }); setPage(1); setSelected(new Set()) }
  const filtered = bills.filter((bill) => bill.period === period && `${bill.student.nim} ${bill.student.name}`.toLowerCase().includes(filters.search.trim().toLowerCase()) && (filters.prodi === "Semua" || bill.student.prodi === filters.prodi) && (filters.angkatan === "Semua" || String(bill.student.angkatan) === filters.angkatan) && (filters.status === "Semua" || statusOf(bill) === filters.status) && (filters.due === "Semua" || (canEdit(bill) && (filters.due === "Lewat Jatuh Tempo" ? bill.due < today() : bill.due >= today() && bill.due <= relativeDate(7)))))
  const active = filtered.filter((bill) => !bill.cancellation)
  const settled = active.filter((bill) => statusOf(bill) === "Lunas")
  const outstanding = active.filter((bill) => remaining(bill) > 0)
  const overdue = outstanding.filter((bill) => statusOf(bill) === "Jatuh Tempo")
  const cards = [
    { title: "Total Tagihan", value: active.reduce((sum, bill) => sum + bill.amount, 0), caption: `${active.length} tagihan aktif · Tidak termasuk dibatalkan`, icon: ReceiptText },
    { title: "Sudah Lunas", value: settled.reduce((sum, bill) => sum + bill.amount, 0), caption: `${settled.length} tagihan lunas`, icon: CheckCircle2 },
    { title: "Belum Lunas", value: outstanding.reduce((sum, bill) => sum + remaining(bill), 0), caption: `Sisa kewajiban dari ${outstanding.length} tagihan`, icon: Clock3 },
    { title: "Jatuh Tempo", value: overdue.reduce((sum, bill) => sum + remaining(bill), 0), caption: `${overdue.length} tagihan lewat jatuh tempo`, icon: CalendarDays },
  ]
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize)), currentPage = Math.min(page, totalPages)
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const chosen = filtered.filter((bill) => selected.has(bill.id))
  const detailBill = bills.find((bill) => bill.id === detail?.id)
  const save = (change: BillingChange) => {
    if (change.kind === "generate") {
      const added = students.filter((student) => change.studentIds.includes(student.id) && !bills.some((bill) => bill.student.id === student.id && bill.period === change.period && !bill.cancellation)).map((student) => ({ id: `UKT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, student, period: change.period, amount: change.amount, due: change.due, note: "", payments: [] }))
      setBills((previous) => [...added, ...previous]); setPeriod(change.period); setFilters(initialFilters); setPage(1)
      toast.success(`${added.length} tagihan berhasil dibuat pada data demo`)
    } else {
      setBills((previous) => previous.map((bill) => {
        if (!change.ids.includes(bill.id)) return bill
        if (change.kind === "cancel") return canCancel(bill) ? { ...bill, cancellation: change.reason } : bill
        if (!canEdit(bill)) return bill
        return change.kind === "due" ? { ...bill, due: change.due } : { ...bill, amount: change.amount, due: change.due, note: change.note }
      }))
      toast.success(change.kind === "cancel" ? "Tagihan dibatalkan pada data demo" : "Tagihan diperbarui pada data demo")
    }
    setAction(null); setSelected(new Set())
  }
  const exportRows = (selection = false) => { exportBills(selection ? chosen : filtered); toast.success("Export tagihan berhasil") }
  return <main className="space-y-6 py-6"><header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><div className="flex items-center gap-3"><h1 className="text-2xl font-semibold tracking-tight">Tagihan UKT</h1><Badge variant="secondary">Demo</Badge></div><p className="mt-1 text-sm text-muted-foreground">Kelola penerbitan, nominal, dan jatuh tempo tagihan mahasiswa.</p></div><div className="flex flex-wrap items-end gap-3"><div className="min-w-52 flex-1"><AcademicSelect label="Tahun Akademik" value={period} options={periods} onChange={(value) => { setPeriod(value); setPage(1); setSelected(new Set()) }} /></div><Button className="h-10" onClick={() => setAction({ kind: "generate" })}><Plus />Generate Tagihan</Button><Button className="h-10" variant="outline" disabled={!filtered.length} onClick={() => exportRows()}><Download />Export</Button></div></header>
    <section aria-label="Ringkasan tagihan" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ title, value, caption, icon: Icon }) => <div key={title} className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{title}</p><Icon className="size-4 text-primary" /></div><p className="mt-4 text-xl font-semibold tabular-nums">{money(value)}</p><p className="mt-2 text-xs text-muted-foreground">{caption}</p></div>)}</section>
    <section className="space-y-3 rounded-xl border bg-card p-4" aria-label="Filter tagihan"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><div className="space-y-1.5 sm:col-span-2"><label htmlFor="billing-search" className="text-xs font-medium text-muted-foreground">Cari Mahasiswa</label><div className="relative"><Search className="absolute top-3 left-3 size-4 text-muted-foreground" /><Input id="billing-search" className="h-10 pl-9" value={filters.search} onChange={(event) => changeFilter("search", event.target.value)} placeholder="Cari NIM atau nama mahasiswa..." /></div></div><AcademicSelect label="Prodi" value={filters.prodi} options={["Semua", ...new Set(students.map((student) => student.prodi))]} onChange={(value) => changeFilter("prodi", value)} /><AcademicSelect label="Angkatan" value={filters.angkatan} options={["Semua", "2023", "2024", "2025"]} onChange={(value) => changeFilter("angkatan", value)} /><AcademicSelect label="Status Tagihan" value={filters.status} options={["Semua", ...statuses]} onChange={(value) => changeFilter("status", value)} /><AcademicSelect label="Jatuh Tempo" value={filters.due} options={["Semua", "Lewat Jatuh Tempo", "7 Hari Mendatang"]} onChange={(value) => changeFilter("due", value)} /></div><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Ringkasan dan export mengikuti filter. Jatuh tempo merupakan bagian dari belum lunas.</p><Button size="sm" variant="ghost" onClick={() => { setFilters(initialFilters); setPage(1); setSelected(new Set()) }}>Reset Filter</Button></div></section>
    <section className="overflow-hidden rounded-xl border bg-card" aria-label="Daftar tagihan">{chosen.length > 0 && <div className="space-y-2 border-b bg-primary/5 p-4"><div className="flex flex-wrap items-center gap-3"><p className="mr-auto text-sm font-medium">{chosen.length} tagihan dipilih</p><Button size="sm" variant="outline" disabled={!chosen.every(canEdit)} onClick={() => setAction({ kind: "due", bills: chosen })}><CalendarDays />Ubah Jatuh Tempo</Button><Button size="sm" variant="outline" onClick={() => exportRows(true)}><Download />Export</Button><Button size="sm" variant="destructive" disabled={!chosen.every(canCancel)} onClick={() => setAction({ kind: "cancel", bills: chosen })}><Ban />Batalkan</Button><Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Batal Pilih</Button></div><p className="text-xs text-muted-foreground">Ubah jatuh tempo hanya untuk tagihan belum lunas. Pembatalan hanya untuk tagihan aktif tanpa pembayaran.</p></div>}
      <BillingTable rows={rows} selected={selected} onSelect={(id) => setSelected((previous) => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next })} onSelectPage={(checked) => setSelected((previous) => { const next = new Set(previous); rows.forEach((row) => { if (checked) next.add(row.id); else next.delete(row.id) }); return next })} onDetail={(bill, payments) => setDetail({ id: bill.id, payments: !!payments })} onAction={setAction} />
      <nav aria-label="Pagination tagihan" className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><p className="text-xs text-muted-foreground">{filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, filtered.length)} dari {filtered.length} tagihan</p><div className="flex items-center gap-3"><Button size="icon" variant="outline" aria-label="Halaman sebelumnya" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft /></Button><span className="text-xs">Halaman {currentPage} dari {totalPages}</span><Button size="icon" variant="outline" aria-label="Halaman berikutnya" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)}><ChevronRight /></Button></div></nav>
    </section><p className="text-xs text-muted-foreground">Data dummy. Perubahan direset saat halaman dimuat ulang. Tagihan dengan pembayaran tidak dapat dibatalkan.</p>
    {detailBill && detail && <BillingDetailSheet bill={detailBill} paymentsOnly={detail.payments} onClose={() => setDetail(null)} />}
    {action && <BillingDialog action={action} bills={bills} period={period} onClose={() => setAction(null)} onSave={save} />}
  </main>
}
