import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LoaderCircle,
  ReceiptText,
  RefreshCw,
  RotateCw,
  WalletCards,
} from "lucide-react"
import { useNavigate } from "react-router"

import { getStudentTuitionBills, studentTuitionErrorMessage } from "@/api/student-tuition"
import {
  createStudentBillPayment,
  getMidtransRedirectUrl,
  getStudentPayments,
  refreshStudentPayment,
  studentPaymentsErrorMessage,
} from "@/api/student-payments"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { StudentPayment } from "@/types/student-payments"
import type { BillStatus, StudentTuitionBill } from "@/types/tuition"
import { toast } from "sonner"
import {
  findReturnedPayment,
  parseMidtransReturn,
  shouldRecheckReturnedPayment,
} from "./payment-return"

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

const paymentStatusLabels: Record<StudentPayment["status"], string> = {
  PENDING: "Menunggu",
  SUCCESS: "Berhasil",
  FAILED: "Gagal",
  EXPIRED: "Kedaluwarsa",
  CANCELLED: "Dibatalkan",
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

function waitForRecheck(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const handleAbort = () => {
      window.clearTimeout(timeout)
      reject(new DOMException("Request aborted", "AbortError"))
    }
    const timeout = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort)
      resolve()
    }, 2000)
    signal.addEventListener("abort", handleAbort, { once: true })
  })
}

function isResumablePayment(payment: StudentPayment) {
  if (payment.status !== "PENDING" || !getMidtransRedirectUrl(payment.redirectUrl)) {
    return false
  }

  if (!payment.expiresAt) return true
  const expiresAt = Date.parse(payment.expiresAt)
  return Number.isFinite(expiresAt) && expiresAt > Date.now()
}

export default function MahasiswaTagihanUKTPage() {
  const navigate = useNavigate()
  const [returnContext] = useState(() => parseMidtransReturn(window.location.search))
  const [bills, setBills] = useState<StudentTuitionBill[]>([])
  const [payments, setPayments] = useState<StudentPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [paymentLoadError, setPaymentLoadError] = useState<string | null>(null)
  const [checkingPayment, setCheckingPayment] = useState(Boolean(returnContext))
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [payingBillId, setPayingBillId] = useState<string | null>(null)

  const returnedPayment = useMemo(
    () => findReturnedPayment(payments, returnContext),
    [payments, returnContext],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadBills() {
      setLoading(true)
      setLoadError(null)
      setPaymentLoadError(null)
      setCheckingPayment(Boolean(returnContext))
      let loadedBills: StudentTuitionBill[] = []
      try {
        const billData = await getStudentTuitionBills(controller.signal)
        loadedBills = billData.bills
        setBills(billData.bills)
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(studentTuitionErrorMessage(error, "Tagihan UKT belum dapat dimuat. Silakan coba lagi."))
          setLoading(false)
          setCheckingPayment(false)
        }
        return
      }

      try {
        const paymentData = await getStudentPayments(controller.signal)
        setPayments(paymentData.payments)

        let payment = findReturnedPayment(paymentData.payments, returnContext)
          ?? paymentData.payments.find((candidate) => (
            candidate.status === "PENDING"
            && candidate.source === "PAYMENT_GATEWAY"
            && candidate.provider === "MIDTRANS"
            && candidate.bill.id === loadedBills[0]?.id
          ))
          ?? null
        if (shouldRecheckReturnedPayment(payment, returnContext)) {
          for (let attempt = 0; attempt < 6 && payment?.status === "PENDING"; attempt += 1) {
            if (attempt > 0) await waitForRecheck(controller.signal)
            payment = await refreshStudentPayment(payment.id, controller.signal)
            setPayments((current) => current.map((item) => item.id === payment?.id ? payment : item))
          }
        } else if (payment?.status === "PENDING") {
          payment = await refreshStudentPayment(payment.id, controller.signal)
          setPayments((current) => current.map((item) => item.id === payment?.id ? payment : item))
        }
        if (payment?.status === "SUCCESS") {
          const [refreshedBills, refreshedPayments] = await Promise.all([
            getStudentTuitionBills(controller.signal),
            getStudentPayments(controller.signal),
          ])
          setBills(refreshedBills.bills)
          setPayments(refreshedPayments.payments)
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setPaymentLoadError(studentPaymentsErrorMessage(error, "Status pembayaran belum dapat diperiksa."))
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
          setCheckingPayment(false)
        }
      }
    }

    void loadBills()
    return () => controller.abort()
  }, [loadAttempt, returnContext])

  async function continueToPayment(targetBill: StudentTuitionBill, existingPayment?: StudentPayment) {
    setPayingBillId(targetBill.id)
    try {
      const payment = existingPayment ?? await createStudentBillPayment(targetBill.id)
      const redirectUrl = getMidtransRedirectUrl(payment.redirectUrl)
      if (!redirectUrl) {
        toast.error("Tautan pembayaran dari Midtrans tidak valid. Silakan coba lagi.")
        return
      }
      window.location.assign(redirectUrl)
    } catch (error) {
      toast.error(studentPaymentsErrorMessage(error, "Pembayaran belum dapat dibuat. Silakan coba lagi."))
    } finally {
      setPayingBillId(null)
    }
  }

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
  const pendingPayment = payments.find(
    (payment) => payment.bill.id === bill.id && isResumablePayment(payment),
  )
  const returnedBill = returnedPayment
    ? bills.find((candidate) => candidate.id === returnedPayment.bill.id)
    : undefined
  const canResumeReturnedPayment = returnedPayment
    ? isResumablePayment(returnedPayment)
    : false

  const refreshStatus = () => setLoadAttempt((current) => current + 1)

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Keuangan mahasiswa</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Tagihan UKT</h1>
          <p className="mt-2 text-sm text-muted-foreground">Lihat nominal, jatuh tempo, dan status pembayaran UKT yang tercatat.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={refreshStatus} disabled={checkingPayment}>
            <RefreshCw /> Perbarui Status
          </Button>
          <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
            <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">Tahun Akademik</span>
            <strong className="font-medium">{academicPeriod(bill)}</strong>
          </div>
        </div>
      </header>

      {returnContext && (
        checkingPayment ? (
          <Alert className="border-blue-200 bg-blue-50/80 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            <RotateCw className="animate-spin" aria-hidden="true" />
            <AlertTitle>Memeriksa status pembayaran</AlertTitle>
            <AlertDescription className="text-blue-800 dark:text-blue-300">Menunggu konfirmasi transaksi terbaru dari Midtrans.</AlertDescription>
          </Alert>
        ) : paymentLoadError || !returnedPayment ? (
          <Alert className="border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle aria-hidden="true" />
            <AlertTitle>Status pembayaran belum dapat dipastikan</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{paymentLoadError ?? "Transaksi yang dikembalikan Midtrans belum ditemukan pada akun ini."}</span>
              <Button type="button" variant="outline" size="sm" onClick={refreshStatus}><RefreshCw />Periksa Lagi</Button>
            </AlertDescription>
          </Alert>
        ) : returnedPayment.status === "SUCCESS" ? (
          <Alert className="border-emerald-200 bg-emerald-50/80 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            <CheckCircle2 aria-hidden="true" />
            <AlertTitle>Pembayaran berhasil</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>Pembayaran sudah dikonfirmasi dan tagihan telah diperbarui.</span>
              <Button type="button" variant="outline" size="sm" onClick={() => navigate("/mahasiswa/riwayat-pembayaran")}>Lihat Riwayat</Button>
            </AlertDescription>
          </Alert>
        ) : returnedPayment.status === "PENDING" ? (
          <Alert className="border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <Clock3 aria-hidden="true" />
            <AlertTitle>{returnContext.action === "back" ? "Halaman pembayaran ditutup" : "Pembayaran masih menunggu"}</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{returnContext.action === "back" ? canResumeReturnedPayment ? "Transaksi belum dibatalkan. Kamu dapat melanjutkan pembayaran sebelum kedaluwarsa." : "Sesi pembayaran sudah tidak dapat dilanjutkan. Buat pembayaran baru dari tagihan yang masih tersedia." : "Selesaikan instruksi pembayaran, lalu perbarui status setelah dana berhasil diproses."}</span>
              {canResumeReturnedPayment && returnedBill && <Button type="button" variant="outline" size="sm" onClick={() => void continueToPayment(returnedBill, returnedPayment)}><ExternalLink />Lanjutkan</Button>}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertTitle>Pembayaran tidak selesai</AlertTitle>
            <AlertDescription>Transaksi berstatus {paymentStatusLabels[returnedPayment.status].toLowerCase()}. Kamu dapat membuat pembayaran baru jika tagihan masih tersedia.</AlertDescription>
          </Alert>
        )
      )}

      {isOverdue && (
        <Alert className="border-red-300 bg-red-50/80 px-4 py-3 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <AlertTriangle className="size-5" aria-hidden="true" />
          <AlertTitle>Tagihan telah melewati jatuh tempo</AlertTitle>
          <AlertDescription className="text-red-800 dark:text-red-300">Hubungi bagian keuangan jika pembayaranmu belum tercatat atau mengalami kendala.</AlertDescription>
        </Alert>
      )}

      {isPaid && returnedPayment?.status !== "SUCCESS" && (
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

          {!isPaid && (
            <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Bayar melalui Midtrans</p>
                <p className="mt-1 text-sm text-muted-foreground">Nominal pembayaran dihitung dari sisa tagihan oleh sistem.</p>
              </div>
              <Button
                type="button"
                className="shrink-0"
                disabled={payingBillId === bill.id}
                onClick={() => void continueToPayment(bill, pendingPayment)}
              >
                {payingBillId === bill.id ? <LoaderCircle className="animate-spin" /> : <ExternalLink />}
                {payingBillId === bill.id ? "Menyiapkan..." : pendingPayment ? "Lanjutkan Pembayaran" : "Bayar Sekarang"}
              </Button>
            </div>
          )}
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
