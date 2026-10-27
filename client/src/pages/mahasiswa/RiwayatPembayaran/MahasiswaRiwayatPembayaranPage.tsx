import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Eye,
  ExternalLink,
  FileClock,
  FilterX,
  History,
  ReceiptText,
  Search,
  WalletCards,
} from "lucide-react"

import { getMidtransRedirectUrl, getStudentPayments, studentPaymentsErrorMessage } from "@/api/student-payments"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type {
  PaymentStatus,
  PaymentTransaction,
  StudentPayment,
  StudentPaymentsResponse,
} from "@/types/student-payments"

const allStatuses = "Semua Status"
const allAcademicYears = "Semua Tahun Akademik"

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

const fullDate = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
})

const shortDate = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
})

const monthLabel = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
})

const statusTone: Record<PaymentStatus, string> = {
  Berhasil: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Menunggu: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Gagal: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
  Kedaluwarsa: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-300",
  Dibatalkan: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
}

const paymentStatus: Record<StudentPayment["status"], PaymentStatus> = {
  SUCCESS: "Berhasil",
  PENDING: "Menunggu",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
}

const paymentMethod: Record<StudentPayment["method"], string> = {
  TRANSFER_BANK: "Transfer Bank",
  VIRTUAL_ACCOUNT: "Virtual Account",
  CASH: "Tunai",
}

function toTransaction(payment: StudentPayment): PaymentTransaction {
  const semester = payment.bill.academicYear.semester === "GANJIL" ? "Ganjil" : "Genap"
  return {
    id: payment.id,
    transactionNumber: payment.paymentNumber,
    billType: `UKT Semester ${semester}`,
    academicYear: `${payment.bill.academicYear.year} ${semester}`,
    date: payment.paidAt ?? payment.createdAt,
    amount: payment.amount,
    method: paymentMethod[payment.method],
    status: paymentStatus[payment.status],
    paymentReference: payment.reference ?? payment.source ?? "-",
    paymentDeadline: payment.status === "PENDING" ? payment.expiresAt ?? undefined : undefined,
    redirectUrl: payment.status === "PENDING" ? getMidtransRedirectUrl(payment.redirectUrl) ?? undefined : undefined,
  }
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant="outline" className={cn("shrink-0", statusTone[status])}>{status}</Badge>
}

function downloadReceipt(transaction: PaymentTransaction) {
  const lines = [
    "BUKTI PEMBAYARAN SIAKAD",
    `No. Transaksi: ${transaction.transactionNumber}`,
    `Jenis Tagihan: ${transaction.billType}`,
    `Tahun Akademik: ${transaction.academicYear}`,
    `Tanggal: ${fullDate.format(new Date(transaction.date))}`,
    `Metode: ${transaction.method}`,
    `Referensi: ${transaction.paymentReference}`,
    `Nominal: ${currency.format(transaction.amount)}`,
    `Status: ${transaction.status}`,
  ]
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" }))
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = `bukti-${transaction.transactionNumber}.txt`
  anchor.click()
  URL.revokeObjectURL(url)
}

function continuePayment(transaction: PaymentTransaction) {
  if (transaction.redirectUrl) window.location.assign(transaction.redirectUrl)
}

export default function MahasiswaRiwayatPembayaranPage() {
  const [paymentData, setPaymentData] = useState<StudentPaymentsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState(allStatuses)
  const [academicYearFilter, setAcademicYearFilter] = useState(allAcademicYears)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null)
  const paymentTransactions = useMemo(
    () => paymentData?.payments.map(toTransaction) ?? [],
    [paymentData],
  )

  useEffect(() => {
    const controller = new AbortController()

    void getStudentPayments(controller.signal)
      .then(setPaymentData)
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return
        setError(studentPaymentsErrorMessage(requestError, "Riwayat pembayaran gagal dimuat."))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [retryKey])

  const retry = () => {
    setLoading(true)
    setError(null)
    setRetryKey((key) => key + 1)
  }

  const academicYears = useMemo(
    () => [...new Set(paymentTransactions.map((transaction) => transaction.academicYear))],
    [paymentTransactions],
  )

  const summary = paymentData?.summary ?? { totalPaid: 0, successful: 0, pending: 0 }

  const groupedTransactions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = paymentTransactions.filter((transaction) => {
      const transactionDate = transaction.date.slice(0, 10)
      const matchesQuery = !normalizedQuery
        || transaction.transactionNumber.toLowerCase().includes(normalizedQuery)
        || transaction.billType.toLowerCase().includes(normalizedQuery)
      const matchesStatus = statusFilter === allStatuses || transaction.status === statusFilter
      const matchesAcademicYear = academicYearFilter === allAcademicYears || transaction.academicYear === academicYearFilter
      const matchesStartDate = !startDate || transactionDate >= startDate
      const matchesEndDate = !endDate || transactionDate <= endDate
      return matchesQuery && matchesStatus && matchesAcademicYear && matchesStartDate && matchesEndDate
    })

    return filtered.reduce<Record<string, PaymentTransaction[]>>((groups, transaction) => {
      const label = monthLabel.format(new Date(transaction.date))
      groups[label] = [...(groups[label] ?? []), transaction]
      return groups
    }, {})
  }, [academicYearFilter, endDate, paymentTransactions, query, startDate, statusFilter])

  const hasFilters = Boolean(query || startDate || endDate || statusFilter !== allStatuses || academicYearFilter !== allAcademicYears)
  const resultCount = Object.values(groupedTransactions).reduce((total, transactions) => total + transactions.length, 0)

  const resetFilters = () => {
    setQuery("")
    setStatusFilter(allStatuses)
    setAcademicYearFilter(allAcademicYears)
    setStartDate("")
    setEndDate("")
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header>
        <p className="text-sm font-medium text-primary">Keuangan mahasiswa</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Riwayat Pembayaran</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Lacak seluruh transaksi, status pembayaran, dan bukti pembayaran dalam satu tempat.</p>
      </header>

      {loading ? (
        <div className="space-y-3" aria-label="Memuat riwayat pembayaran">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3"><Skeleton className="col-span-2 h-28 lg:col-span-1" /><Skeleton className="h-28" /><Skeleton className="h-28" /></div>
          <Skeleton className="h-40 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle /><AlertTitle>Riwayat pembayaran tidak dapat dimuat</AlertTitle>
          <AlertDescription className="space-y-3"><p>{error}</p><Button variant="outline" size="sm" onClick={retry}>Coba Lagi</Button></AlertDescription>
        </Alert>
      ) : <>
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3" aria-label="Ringkasan pembayaran">
        <Card className="col-span-2 lg:col-span-1">
          <CardContent className="flex items-center justify-between gap-4">
            <div><p className="text-xs text-muted-foreground">Total Dibayar</p><p className="mt-1 text-xl font-semibold tabular-nums sm:text-2xl">{currency.format(summary.totalPaid)}</p></div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><WalletCards className="size-5" aria-hidden="true" /></span>
          </CardContent>
        </Card>
        <Card>
          <CardContent><div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />Transaksi Berhasil</div><p className="mt-2 text-2xl font-semibold tabular-nums">{summary.successful}</p></CardContent>
        </Card>
        <Card>
          <CardContent><div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-4 text-amber-600" aria-hidden="true" />Pending</div><p className="mt-2 text-2xl font-semibold tabular-nums">{summary.pending}</p></CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="border-b"><CardTitle className="flex items-center gap-2"><Search className="size-4 text-primary" aria-hidden="true" />Cari & Filter</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="relative block">
            <span className="sr-only">Cari nomor transaksi atau jenis tagihan</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari no. transaksi atau jenis tagihan" className="h-10 pl-9" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value ?? allStatuses)}>
              <SelectTrigger className="h-10 w-full" aria-label="Filter status"><SelectValue /></SelectTrigger>
              <SelectContent align="start">
                <SelectItem value={allStatuses}>{allStatuses}</SelectItem>
                {(["Berhasil", "Menunggu", "Gagal", "Kedaluwarsa", "Dibatalkan"] as PaymentStatus[]).map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={academicYearFilter} onValueChange={(value) => setAcademicYearFilter(value ?? allAcademicYears)}>
              <SelectTrigger className="h-10 w-full" aria-label="Filter tahun akademik"><SelectValue /></SelectTrigger>
              <SelectContent align="start">
                <SelectItem value={allAcademicYears}>{allAcademicYears}</SelectItem>
                {academicYears.map((year) => <SelectItem key={year} value={year}>{year}</SelectItem>)}
              </SelectContent>
            </Select>
            <label><span className="sr-only">Tanggal mulai</span><Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-10" aria-label="Tanggal mulai" /></label>
            <label><span className="sr-only">Tanggal akhir</span><Input type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-10" aria-label="Tanggal akhir" /></label>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>{resultCount} transaksi ditemukan</span>
            {hasFilters && <Button type="button" variant="ghost" size="sm" onClick={resetFilters}><FilterX />Reset filter</Button>}
          </div>
        </CardContent>
      </Card>

      {resultCount ? (
        <section className="space-y-6" aria-label="Daftar transaksi">
          {Object.entries(groupedTransactions).map(([month, transactions]) => (
            <div key={month} className="space-y-3">
              <div className="flex items-center gap-2"><CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" /><h2 className="font-semibold capitalize">{month}</h2><span className="text-xs text-muted-foreground">{transactions.length} transaksi</span></div>
              <div className="grid gap-3 xl:grid-cols-2">
                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="gap-4 py-4 transition-colors hover:border-primary/35">
                    <CardContent className="px-4 sm:px-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><ReceiptText className="size-5" aria-hidden="true" /></span>
                          <div className="min-w-0"><h3 className="font-semibold leading-5">{transaction.billType}</h3><p className="mt-1 truncate text-xs text-muted-foreground">{transaction.transactionNumber}</p></div>
                        </div>
                        <StatusBadge status={transaction.status} />
                      </div>
                      <div className="mt-4 flex items-end justify-between gap-4 border-t pt-4">
                        <div><p className="text-xl font-semibold tabular-nums">{currency.format(transaction.amount)}</p><p className="mt-1 text-xs text-muted-foreground">{shortDate.format(new Date(transaction.date))} · {transaction.method}</p></div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTransaction(transaction)}><Eye />Lihat Detail</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <FileClock className="size-11 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold">{hasFilters ? "Transaksi tidak ditemukan" : "Belum ada riwayat pembayaran"}</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {hasFilters
                ? "Coba ubah kata pencarian atau filter untuk melihat riwayat pembayaran lainnya."
                : "Transaksi pembayaran akan muncul di sini setelah tagihan diterbitkan."}
            </p>
            {hasFilters && <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}><FilterX />Reset Filter</Button>}
          </CardContent>
        </Card>
      )}
      </>}

      <Dialog open={Boolean(selectedTransaction)} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        {selectedTransaction && (
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <div className="mb-1 flex items-center justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><CreditCard className="size-5" aria-hidden="true" /></span><StatusBadge status={selectedTransaction.status} /></div>
              <DialogTitle>Detail Pembayaran</DialogTitle>
              <DialogDescription>Informasi transaksi dan status pembayaran terkini.</DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border bg-muted/20 p-4"><p className="text-xs text-muted-foreground">Nominal pembayaran</p><p className="mt-1 text-2xl font-semibold tabular-nums">{currency.format(selectedTransaction.amount)}</p></div>

            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-muted-foreground">No. Transaksi</dt><dd className="mt-1 font-medium break-all">{selectedTransaction.transactionNumber}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Jenis Tagihan</dt><dd className="mt-1 font-medium">{selectedTransaction.billType}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Tahun Akademik</dt><dd className="mt-1 font-medium">{selectedTransaction.academicYear}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Tanggal</dt><dd className="mt-1 font-medium">{fullDate.format(new Date(selectedTransaction.date))} WIB</dd></div>
              <div><dt className="text-xs text-muted-foreground">Metode Pembayaran</dt><dd className="mt-1 font-medium">{selectedTransaction.method}</dd></div>
              <div><dt className="text-xs text-muted-foreground">Reference / Payment Code</dt><dd className="mt-1 font-medium break-all">{selectedTransaction.paymentReference}</dd></div>
            </dl>

            {selectedTransaction.status === "Menunggu" && selectedTransaction.paymentDeadline && (
              <Alert className="border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <Clock3 aria-hidden="true" /><AlertTitle>Menunggu pembayaran</AlertTitle>
                <AlertDescription className="space-y-1 text-amber-800 dark:text-amber-300"><p>Batas pembayaran: {fullDate.format(new Date(selectedTransaction.paymentDeadline))} WIB.</p><p>Gunakan kode pembayaran di atas sebelum batas waktu berakhir.</p></AlertDescription>
              </Alert>
            )}

            {selectedTransaction.status === "Gagal" && (
              <Alert variant="destructive"><AlertCircle aria-hidden="true" /><AlertTitle>Pembayaran belum berhasil</AlertTitle><AlertDescription>Transaksi tidak dapat diselesaikan. Tidak ada saldo yang tercatat sebagai pembayaran.</AlertDescription></Alert>
            )}

            <DialogFooter className="gap-2 sm:justify-between">
              {selectedTransaction.status === "Berhasil" && <Button type="button" className="w-full sm:w-auto" onClick={() => downloadReceipt(selectedTransaction)}><Download />Download Bukti Pembayaran</Button>}
              {selectedTransaction.status === "Menunggu" && selectedTransaction.redirectUrl && (
                <Button type="button" className="w-full sm:w-auto" onClick={() => continuePayment(selectedTransaction)}>
                  <ExternalLink />Lanjutkan Pembayaran
                </Button>
              )}
              {!(["Berhasil", "Gagal"] as PaymentStatus[]).includes(selectedTransaction.status) && <p className="text-xs leading-5 text-muted-foreground"><History className="mr-1 inline size-3.5" aria-hidden="true" />Status akan diperbarui otomatis setelah ada perubahan.</p>}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </main>
  )
}
