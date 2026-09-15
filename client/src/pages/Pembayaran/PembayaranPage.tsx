import { CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Loader2, Search, Wallet, XCircle } from "lucide-react"
import { AcademicFilterSelect } from "@/components/academic/AcademicFilterSelect"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppDispatch } from "@/hooks/redux"
import { setPaymentFilters, setPaymentPage, resetPaymentFilters } from "@/features/slice/paymentSlice"
import type { PaymentFilters, PaymentMethod, PaymentStatus } from "@/types/payments"
import { PaymentTable } from "./PaymentTable"
import { PaymentDetail, PaymentReview } from "./PaymentDialogs"
import { money, statusLabels, methodLabels } from "./payment-format"
import { usePayments } from "./use-payments"

export default function PembayaranPage() {
  const dispatch = useAppDispatch()
  const payments = usePayments()
  const { list, filters, options, detail, mutation, panel, page, limit, invalidRange } = payments
  const summary = list.data?.summary
  const pagination = list.data?.pagination
  const rows = list.data?.payments ?? []
  const cards = [
    { title: "Total Pembayaran", value: summary ? money(summary.totalSuccessfulAmount) : "—", caption: "Nominal transaksi berhasil", icon: Wallet },
    { title: "Transaksi Berhasil", value: summary?.successfulTransactions ?? "—", caption: "Pembayaran telah dikonfirmasi", icon: CheckCircle2 },
    { title: "Menunggu Verifikasi", value: summary?.pendingTransactions ?? "—", caption: "Menunggu admin atau konfirmasi gateway", icon: Clock3 },
    { title: "Transaksi Gagal", value: summary?.failedTransactions ?? "—", caption: "Tidak termasuk transaksi dibatalkan", icon: XCircle },
  ]
  const totalRows = pagination?.totalRows ?? 0
  const totalPages = Math.max(1, pagination?.totalPages ?? 1)
  const changeFilter = (next: Partial<PaymentFilters>) => dispatch(setPaymentFilters(next))
  const detailProps = { payment: detail.data?.id === panel?.id ? detail.data : null, loading: detail.loading || (!detail.data && !detail.error), error: detail.error, onRetry: payments.retryDetail, onClose: payments.closePanel }
  return <main className="space-y-6 py-6">
    <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><h1 className="text-2xl font-semibold tracking-tight">Pembayaran</h1><p className="mt-1 text-sm text-muted-foreground">Pantau transaksi pembayaran mahasiswa dan tinjau pembayaran yang memerlukan verifikasi.</p></div><div className="flex flex-wrap items-end gap-3"><div className="min-w-52 flex-1"><AcademicFilterSelect label="Tahun Akademik" value={filters.academicYearId} options={options.data?.years ?? []} disabled={options.loading} onChange={value => changeFilter({ academicYearId: value ? Number(value) : undefined })} /></div><Button variant="outline" className="h-10" disabled={payments.exporting.loading || list.loading || !totalRows || invalidRange} onClick={() => void payments.exportAll()}>{payments.exporting.loading ? <Loader2 className="animate-spin" /> : <Download />}{payments.exporting.loading ? "Mengexport..." : "Export"}</Button></div></header>
    {options.error && <div role="alert" className="rounded-lg border p-4 text-sm text-destructive">{options.error}<Button variant="link" onClick={payments.retryOptions}>Coba Lagi</Button></div>}
    <section aria-label="Ringkasan pembayaran" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ title, value, caption, icon: Icon }) => <div key={title} className="rounded-xl border bg-card p-5"><div className="flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">{title}</p><Icon className="size-4 text-primary" /></div>{list.loading ? <Skeleton className="mt-4 h-7 w-28" /> : <p className="mt-4 text-xl font-semibold tabular-nums">{value}</p>}<p className="mt-2 text-xs text-muted-foreground">{caption}</p></div>)}</section>
    <section aria-label="Filter pembayaran" className="space-y-3 rounded-xl border bg-card p-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="space-y-1.5"><label htmlFor="payment-search" className="text-xs font-medium text-muted-foreground">Cari Transaksi</label><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input id="payment-search" className="h-10 pl-9" maxLength={200} placeholder="NIM, nama, atau no transaksi..." value={payments.search} onChange={event => payments.setSearch(event.target.value)} /></div></div>
      <AcademicFilterSelect label="Prodi" value={filters.studyProgramId} options={options.data?.programs ?? []} disabled={options.loading} onChange={value => changeFilter({ studyProgramId: value ? Number(value) : undefined })} />
      <AcademicFilterSelect label="Metode Pembayaran" value={filters.method} options={Object.entries(methodLabels).map(([id, label]) => ({ id, label }))} onChange={value => changeFilter({ method: value as PaymentMethod | undefined })} />
      <AcademicFilterSelect label="Status Pembayaran" value={filters.status} options={Object.entries(statusLabels).map(([id, label]) => ({ id, label }))} onChange={value => changeFilter({ status: value as PaymentStatus | undefined })} />
      <div className="space-y-1.5"><label htmlFor="payment-start" className="text-xs font-medium text-muted-foreground">Tanggal Dibuat — Mulai</label><Input id="payment-start" type="date" value={filters.startDate ?? ""} max={filters.endDate} onChange={event => changeFilter({ startDate: event.target.value || undefined })} className="h-10" aria-invalid={invalidRange} /></div><div className="space-y-1.5"><label htmlFor="payment-end" className="text-xs font-medium text-muted-foreground">Tanggal Dibuat — Akhir</label><Input id="payment-end" type="date" value={filters.endDate ?? ""} min={filters.startDate} onChange={event => changeFilter({ endDate: event.target.value || undefined })} className="h-10" aria-invalid={invalidRange} /></div>
    </div>{invalidRange && <p role="alert" className="text-sm text-destructive">Tanggal akhir harus sama atau setelah tanggal mulai.</p>}<div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Ringkasan mengikuti filter kecuali status. Rentang tanggal berdasarkan waktu transaksi dibuat (WIB).</p><Button size="sm" variant="ghost" onClick={() => { payments.setSearch(""); dispatch(resetPaymentFilters()) }}>Reset Filter</Button></div></section>
    <section className="overflow-hidden rounded-xl border bg-card" aria-label="Daftar pembayaran" aria-busy={list.loading}>
      {list.loading ? <div className="space-y-4 p-5" role="status" aria-label="Memuat pembayaran">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div> : list.error ? <div role="alert" className="space-y-3 p-8 text-center"><p className="text-destructive">{list.error}</p><Button variant="outline" onClick={payments.retryList}>Coba Lagi</Button></div> : invalidRange ? <p className="p-8 text-center text-sm text-muted-foreground">Perbaiki rentang tanggal untuk menampilkan transaksi.</p> : <PaymentTable rows={rows} onDetail={id => payments.openPanel({ id, mode: "detail" })} onBill={id => payments.openPanel({ id, mode: "bill" })} onReview={(id, cancel) => payments.openPanel({ id, mode: cancel ? "cancel" : "verify" })} />}
      <nav aria-label="Pagination pembayaran" className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><p className="text-xs text-muted-foreground">{totalRows ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, totalRows)} dari {totalRows} transaksi</p><div className="flex items-center gap-3"><Button size="icon" variant="outline" aria-label="Halaman sebelumnya" disabled={list.loading || page === 1 || invalidRange} onClick={() => dispatch(setPaymentPage(page - 1))}><ChevronLeft /></Button><span className="text-xs">Halaman {page} dari {totalPages}</span><Button size="icon" variant="outline" aria-label="Halaman berikutnya" disabled={list.loading || !!list.error || page >= totalPages || invalidRange} onClick={() => dispatch(setPaymentPage(page + 1))}><ChevronRight /></Button></div></nav>
    </section>
    <p className="text-xs text-muted-foreground">Export memuat seluruh transaksi sesuai filter. Tanggal pembayaran yang belum tersedia ditampilkan sebagai —.</p>
    {panel && (panel.mode === "detail" || panel.mode === "bill" ? <PaymentDetail {...detailProps} billOnly={panel.mode === "bill"} /> : <PaymentReview key={`${panel.id}:${panel.mode}`} {...detailProps} cancel={panel.mode === "cancel"} pending={mutation.loading} mutationError={mutation.error} onSave={payments.save} />)}
  </main>
}
