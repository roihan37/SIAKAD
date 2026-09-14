import { useEffect, useState } from "react"
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Plus, ReceiptText, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { AcademicFilterSelect } from "@/components/academic/AcademicFilterSelect"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { getTuitionBills, getTuitionOptions, generateTuitionBills } from "@/features/action/tuitionThunk"
import { setBillFilters, setBillPage, resetBillFilters, clearGenerateError } from "@/features/slice/tuitionSlice"
import type { Bill, BillFilters, BillStatus, GenerateBills } from "@/types/tuition"
import { BillingDialog } from "./BillingDialogs"
import { BillingDetailSheet } from "./BillingDetailSheet"
import { BillingTable } from "./BillingTable"
import { exportBills, money, statusLabels } from "./billing-format"

export default function TagihanUKTPage() {
  const dispatch = useAppDispatch()
  const { data, filters, page, limit, loading, error, options, optionsLoading, optionsError, generating, generateError } = useAppSelector(state => state.tuition)
  const [search, setSearch] = useState(filters.search)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [generateOpen, setGenerateOpen] = useState(false)
  const [detail, setDetail] = useState<Bill | null>(null)
  useEffect(() => { const request = dispatch(getTuitionOptions()); return () => request.abort() }, [dispatch])
  useEffect(() => {
    const timeout = setTimeout(() => { if (search.trim() !== filters.search) dispatch(setBillFilters({ search: search.trim() })) }, 400)
    return () => clearTimeout(timeout)
  }, [dispatch, search, filters.search])
  useEffect(() => {
    const request = dispatch(getTuitionBills({ ...filters, page, limit }))
    return () => request.abort()
  }, [dispatch, filters, page, limit])

  const changeFilter = (next: Partial<BillFilters>) => { setSelected(new Set()); setDetail(null); dispatch(setBillFilters(next)) }
  const changePage = (next: number) => { setSelected(new Set()); setDetail(null); dispatch(setBillPage(next)) }
  const reload = () => dispatch(getTuitionBills({ ...filters, page, limit }))
  async function generate(payload: GenerateBills) {
    const id = toast.loading("Membuat tagihan UKT...")
    try {
      const result = await dispatch(generateTuitionBills(payload)).unwrap()
      toast.success(`${result.generated} tagihan dibuat, ${result.skipped} dilewati karena sudah tersedia.`, { id })
      setGenerateOpen(false); setSelected(new Set()); setDetail(null); setSearch("")
      // A new filter object triggers a single reload, including after generating in the same period.
      dispatch(setBillFilters({ tahunAkademikId: payload.tahunAkademikId, prodiId: payload.prodiId, status: undefined, search: "" }))
    } catch (reason) { toast.error(typeof reason === "string" ? reason : "Generate tagihan gagal.", { id }) }
  }
  const rows = data?.bills ?? []
  const chosen = rows.filter(bill => selected.has(bill.id))
  const summary = data?.summary
  const cards = [
    { title: "Total Tagihan", value: summary?.totalBills, caption: summary ? `Nominal ${money(summary.totalAmount)}` : "Seluruh tagihan", icon: ReceiptText },
    { title: "Sudah Lunas", value: summary?.paid, caption: "Tagihan dengan pembayaran penuh", icon: CheckCircle2 },
    { title: "Belum Lunas", value: summary ? summary.unpaid + summary.overdue : undefined, caption: summary ? `Sisa ${money(summary.outstandingAmount)}` : "Termasuk tagihan lewat jatuh tempo", icon: Clock3 },
    { title: "Jatuh Tempo", value: summary?.overdue, caption: "Tagihan yang melewati batas pembayaran", icon: CalendarDays },
  ]
  const pagination = data?.pagination
  const total = pagination?.totalRows ?? 0
  const totalPages = Math.max(1, pagination?.totalPages ?? 1)
  return <main className="space-y-6 py-6">
    <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
      <div><h1 className="text-2xl font-semibold tracking-tight">Tagihan UKT</h1><p className="mt-1 text-sm text-muted-foreground">Kelola penerbitan, nominal, dan jatuh tempo tagihan mahasiswa.</p></div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-52 flex-1"><AcademicFilterSelect label="Tahun Akademik" value={filters.tahunAkademikId} options={options.years} disabled={optionsLoading} onChange={value => changeFilter({ tahunAkademikId: value ? Number(value) : undefined })} /></div>
        <Button className="h-10" disabled={optionsLoading || !!optionsError || !options.years.length || !options.programs.length || generating} onClick={() => { dispatch(clearGenerateError()); setGenerateOpen(true) }}><Plus />Generate Tagihan</Button>
        <Button className="h-10" variant="outline" disabled={loading || !rows.length} onClick={() => exportBills(rows)}><Download />Export Halaman</Button>
      </div>
    </header>
    {optionsError && <div role="alert" className="rounded-lg border p-4 text-sm text-destructive">{optionsError}<Button variant="link" onClick={() => dispatch(getTuitionOptions())}>Coba lagi</Button></div>}
    <section aria-label="Ringkasan tagihan" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ title, value, caption, icon: Icon }) => <div key={title} className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{title}</p><Icon className="size-4 text-primary" /></div>{loading ? <Skeleton className="mt-4 h-7 w-24" /> : <p className="mt-4 text-xl font-semibold tabular-nums">{value === undefined ? "—" : value.toLocaleString("id-ID")}</p>}<p className="mt-2 text-xs text-muted-foreground">{caption}</p></div>)}
    </section>
    <section className="space-y-3 rounded-xl border bg-card p-4" aria-label="Filter tagihan">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-2"><label htmlFor="billing-search" className="text-xs font-medium text-muted-foreground">Cari Mahasiswa atau Tagihan</label><div className="relative"><Search className="absolute top-3 left-3 size-4 text-muted-foreground" /><Input id="billing-search" className="h-10 pl-9" maxLength={200} value={search} onChange={event => { setSearch(event.target.value); setSelected(new Set()); setDetail(null) }} placeholder="Cari NIM, nama, atau nomor tagihan..." /></div></div>
        <AcademicFilterSelect label="Prodi" value={filters.prodiId} options={options.programs} disabled={optionsLoading} onChange={value => changeFilter({ prodiId: value ? Number(value) : undefined })} />
        <AcademicFilterSelect label="Status Tagihan" value={filters.status} options={Object.entries(statusLabels).map(([id, label]) => ({ id, label }))} onChange={value => changeFilter({ status: value as BillStatus | undefined })} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Ringkasan mengikuti tahun akademik, prodi, dan pencarian. Filter status hanya berlaku pada tabel.</p><Button size="sm" variant="ghost" onClick={() => { setSearch(""); setSelected(new Set()); setDetail(null); dispatch(resetBillFilters()) }}>Reset Filter</Button></div>
    </section>
    <section className="overflow-hidden rounded-xl border bg-card" aria-label="Daftar tagihan" aria-busy={loading}>
      {chosen.length > 0 && <div className="flex flex-wrap items-center gap-3 border-b bg-primary/5 p-4"><p className="mr-auto text-sm font-medium">{chosen.length} tagihan dipilih</p><Button size="sm" variant="outline" onClick={() => exportBills(chosen)}><Download />Export Pilihan</Button><Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Batal Pilih</Button></div>}
      {loading ? <div className="space-y-4 p-5" role="status" aria-label="Memuat tagihan">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div> : error ? <div role="alert" className="space-y-3 p-8 text-center"><p className="text-destructive">{error}</p><Button variant="outline" onClick={reload}>Coba Lagi</Button></div> : <BillingTable rows={rows} selected={selected} onSelect={id => setSelected(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next })} onSelectPage={checked => setSelected(checked ? new Set(rows.map(row => row.id)) : new Set())} onDetail={setDetail} />}
      <nav aria-label="Pagination tagihan" className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><p className="text-xs text-muted-foreground">{total ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)} dari {total} tagihan</p><div className="flex items-center gap-3"><Button size="icon" variant="outline" aria-label="Halaman sebelumnya" disabled={loading || page === 1} onClick={() => changePage(page - 1)}><ChevronLeft /></Button><span className="text-xs">Halaman {page} dari {totalPages}</span><Button size="icon" variant="outline" aria-label="Halaman berikutnya" disabled={loading || !!error || page >= totalPages} onClick={() => changePage(page + 1)}><ChevronRight /></Button></div></nav>
    </section>
    <p className="text-xs text-muted-foreground">Program studi per mahasiswa dan riwayat pembayaran belum tersedia pada data tagihan. Export memuat halaman aktif atau pilihan.</p>
    {detail && <BillingDetailSheet bill={detail} onClose={() => setDetail(null)} />}
    {generateOpen && <BillingDialog options={options} yearId={filters.tahunAkademikId} programId={filters.prodiId} loading={generating} error={generateError} onClose={() => { if (!generating) setGenerateOpen(false) }} onSave={generate} />}
  </main>
}
