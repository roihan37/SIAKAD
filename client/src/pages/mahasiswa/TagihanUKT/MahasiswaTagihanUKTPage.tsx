import { useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ReceiptText,
  RefreshCw,
  WalletCards,
} from "lucide-react"

import { getStudentTuitionBills, studentTuitionErrorMessage } from "@/api/student-tuition"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { BillStatus, StudentTuitionBill } from "@/types/tuition"

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

const date = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Jakarta",
})

const statusLabels: Record<BillStatus, string> = {
  BELUM_DIBAYAR: "Belum Dibayar",
  SEBAGIAN: "Sebagian",
  LUNAS: "Lunas",
  JATUH_TEMPO: "Jatuh Tempo",
}

const statusTone: Record<BillStatus, string> = {
  BELUM_DIBAYAR: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  SEBAGIAN: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  LUNAS: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  JATUH_TEMPO: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
}

function academicPeriod(bill: StudentTuitionBill) {
  const semester = bill.academicYear.semester === "GANJIL"
    ? "Ganjil"
    : bill.academicYear.semester === "GENAP"
      ? "Genap"
      : bill.academicYear.semester
  return `${bill.academicYear.year} ${semester}`
}

function StatusBadge({ status }: { status: BillStatus }) {
  return (
    <Badge variant="outline" className={cn("h-7 px-3", statusTone[status])}>
      {statusLabels[status]}
    </Badge>
  )
}

function LoadingState() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 sm:space-y-6 sm:py-7" aria-busy="true">
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-52 rounded-2xl" />
    </main>
  )
}

export default function MahasiswaTagihanUKTPage() {
  const [bills, setBills] = useState<StudentTuitionBill[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadBills() {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await getStudentTuitionBills(controller.signal)
        setBills(data.bills)
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(studentTuitionErrorMessage(error, "Tagihan UKT belum dapat dimuat. Silakan coba lagi."))
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadBills()
    return () => controller.abort()
  }, [loadAttempt])

  if (loading) return <LoadingState />

  if (loadError) {
    return (
      <main className="mx-auto w-full max-w-7xl py-5 sm:py-7">
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Tagihan UKT gagal dimuat</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>{loadError}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => setLoadAttempt((current) => current + 1)}>
              <RefreshCw /> Muat Ulang
            </Button>
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  const [bill, ...previousBills] = bills

  if (!bill) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
        <Card>
          <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <ReceiptText className="size-11 text-muted-foreground" aria-hidden="true" />
            <h1 className="mt-4 text-xl font-semibold">Tagihan belum diterbitkan</h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">Tagihan UKT akan tampil setelah diterbitkan oleh bagian keuangan.</p>
          </CardContent>
        </Card>
      </main>
    )
  }

  const paymentProgress = bill.amount > 0
    ? Math.min(Math.round((bill.paidAmount / bill.amount) * 100), 100)
    : 0
  const isPaid = bill.status === "LUNAS"
  const isOverdue = bill.status === "JATUH_TEMPO"

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Keuangan mahasiswa</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Tagihan UKT</h1>
          <p className="mt-2 text-sm text-muted-foreground">Lihat nominal, jatuh tempo, dan status pembayaran UKT yang tercatat.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">Tahun Akademik</span>
          <strong className="font-medium">{academicPeriod(bill)}</strong>
        </div>
      </header>

      {isOverdue && (
        <Alert className="border-red-300 bg-red-50/80 px-4 py-3 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <AlertTriangle className="size-5" aria-hidden="true" />
          <AlertTitle>Tagihan telah melewati jatuh tempo</AlertTitle>
          <AlertDescription className="text-red-800 dark:text-red-300">Hubungi bagian keuangan jika pembayaranmu belum tercatat atau mengalami kendala.</AlertDescription>
        </Alert>
      )}

      {isPaid && (
        <Alert className="border-emerald-200 bg-emerald-50/80 px-4 py-3 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="size-5" aria-hidden="true" />
          <AlertTitle>UKT semester ini sudah lunas</AlertTitle>
          <AlertDescription className="text-emerald-800 dark:text-emerald-300">
            Tidak ada sisa pembayaran{bill.paidAt ? `; pembayaran terakhir tercatat pada ${date.format(new Date(bill.paidAt))}.` : "."}
          </AlertDescription>
        </Alert>
      )}

      <Card className={cn("relative overflow-hidden", isOverdue && "ring-red-300 dark:ring-red-900")}>
        <div aria-hidden="true" className="absolute -right-16 -top-20 size-60 rounded-full bg-primary/5 blur-3xl" />
        <CardHeader className="relative border-b sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={bill.status} />
              <span className="text-xs text-muted-foreground">{bill.billNumber}</span>
            </div>
            <CardTitle className="text-base text-muted-foreground">Sisa Tagihan</CardTitle>
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{currency.format(bill.remainingAmount)}</p>
          </div>
          <span className="hidden size-11 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex"><WalletCards className="size-6" aria-hidden="true" /></span>
        </CardHeader>
        <CardContent className="relative space-y-5">
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <div className="rounded-xl bg-muted/45 p-3 sm:p-4"><dt className="text-xs text-muted-foreground">Nominal Tagihan</dt><dd className="mt-1 font-semibold tabular-nums sm:text-lg">{currency.format(bill.amount)}</dd></div>
            <div className="rounded-xl bg-muted/45 p-3 sm:p-4"><dt className="text-xs text-muted-foreground">Sudah Dibayar</dt><dd className="mt-1 font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 sm:text-lg">{currency.format(bill.paidAmount)}</dd></div>
            <div className="col-span-2 rounded-xl bg-muted/45 p-3 sm:p-4 lg:col-span-1"><dt className="text-xs text-muted-foreground">Jatuh Tempo</dt><dd className={cn("mt-1 font-semibold sm:text-lg", isOverdue && "text-red-600 dark:text-red-400")}>{date.format(new Date(bill.dueDate))}</dd></div>
          </dl>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">Progress pembayaran</span><strong className="tabular-nums">{paymentProgress}%</strong></div>
            <div role="progressbar" aria-label="Progress pembayaran UKT" aria-valuemin={0} aria-valuemax={bill.amount} aria-valuenow={bill.paidAmount} className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full transition-[width]", isPaid ? "bg-emerald-600" : "bg-primary")} style={{ width: `${paymentProgress}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2"><Clock3 className="size-4 text-primary" aria-hidden="true" />Riwayat Tagihan</CardTitle>
        </CardHeader>
        <CardContent>
          {previousBills.length === 0 ? (
            <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">Belum ada tagihan semester sebelumnya.</p>
          ) : (
            <ul className="space-y-3">
              {previousBills.map((previousBill) => (
                <li key={previousBill.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{academicPeriod(previousBill)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{previousBill.billNumber} · Jatuh tempo {date.format(new Date(previousBill.dueDate))}</p>
                  </div>
                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="font-semibold tabular-nums">{currency.format(previousBill.amount)}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Sisa {currency.format(previousBill.remainingAmount)}</p>
                    </div>
                    <StatusBadge status={previousBill.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
