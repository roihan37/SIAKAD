import { useState } from "react"
import { Link } from "react-router"
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Landmark,
  ReceiptText,
  ShieldCheck,
  WalletCards,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { tuitionBill, type PaymentStatus, type TuitionStatus } from "./tagihan-ukt-data"

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

const statusTone: Record<TuitionStatus, string> = {
  "Belum Dibayar": "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Sebagian: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  Lunas: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  "Jatuh Tempo": "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
}

const paymentTone: Record<PaymentStatus, string> = {
  Berhasil: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Diproses: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  Gagal: "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
}

function StatusBadge({ status }: { status: TuitionStatus }) {
  return <Badge variant="outline" className={cn("h-7 px-3", statusTone[status])}>{status}</Badge>
}

export default function MahasiswaTagihanUKTPage() {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentPending, setPaymentPending] = useState(false)
  const bill = tuitionBill

  if (!bill) {
    return (
      <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
        <Card><CardContent className="flex min-h-72 flex-col items-center justify-center px-6 text-center"><ReceiptText className="size-11 text-muted-foreground" aria-hidden="true" /><h1 className="mt-4 text-xl font-semibold">Tagihan belum diterbitkan</h1><p className="mt-2 max-w-md text-sm text-muted-foreground">Tagihan UKT akan tampil setelah periode pembayaran dibuka oleh bagian keuangan.</p></CardContent></Card>
      </main>
    )
  }

  const remainingAmount = Math.max(bill.totalAmount - bill.paidAmount, 0)
  const paymentProgress = Math.min(Math.round((bill.paidAmount / bill.totalAmount) * 100), 100)
  const isPaid = bill.status === "Lunas" || remainingAmount === 0
  const isOverdue = bill.status === "Jatuh Tempo"

  const startDummyPayment = () => {
    setPaymentDialogOpen(false)
    setPaymentPending(true)
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 py-5 pb-28 sm:space-y-6 sm:py-7 sm:pb-28 md:pb-7">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Keuangan mahasiswa</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Tagihan UKT</h1>
          <p className="mt-2 text-sm text-muted-foreground">Lihat status dan selesaikan kewajiban pembayaran semester berjalan.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm">
          <CalendarClock className="size-4 text-muted-foreground" aria-hidden="true" />
          <span className="text-muted-foreground">Tahun Akademik</span>
          <strong className="font-medium">{bill.academicYear}</strong>
        </div>
      </header>

      {isOverdue && (
        <Alert className="border-red-300 bg-red-50/80 px-4 py-3 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          <AlertTriangle className="size-5" aria-hidden="true" />
          <AlertTitle>Tagihan telah melewati jatuh tempo</AlertTitle>
          <AlertDescription className="text-red-800 dark:text-red-300">Segera selesaikan pembayaran atau hubungi bagian keuangan jika mengalami kendala.</AlertDescription>
        </Alert>
      )}

      {paymentPending && (
        <Alert className="border-blue-200 bg-blue-50/80 px-4 py-3 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          <Clock3 className="size-5" aria-hidden="true" />
          <AlertTitle>Pembayaran sedang diproses</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-300">Transaksi dummy sudah dibuat. Status akan diperbarui setelah pembayaran diverifikasi.</AlertDescription>
        </Alert>
      )}

      {isPaid && (
        <Alert className="border-emerald-200 bg-emerald-50/80 px-4 py-3 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="size-5" aria-hidden="true" />
          <AlertTitle>UKT semester ini sudah lunas</AlertTitle>
          <AlertDescription className="text-emerald-800 dark:text-emerald-300">Tidak ada sisa pembayaran. Bukti pembayaran tersedia di riwayat transaksi.</AlertDescription>
        </Alert>
      )}

      <Card className={cn("relative overflow-hidden", isOverdue && "ring-red-300 dark:ring-red-900")}>
        <div aria-hidden="true" className="absolute -right-16 -top-20 size-60 rounded-full bg-primary/5 blur-3xl" />
        <CardHeader className="relative border-b sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={bill.status} />
              <span className="text-xs text-muted-foreground">{bill.invoiceNumber}</span>
            </div>
            <CardTitle className="text-base text-muted-foreground">Sisa Tagihan</CardTitle>
            <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{currency.format(remainingAmount)}</p>
          </div>
          <span className="hidden size-11 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex"><WalletCards className="size-6" aria-hidden="true" /></span>
        </CardHeader>
        <CardContent className="relative space-y-5">
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <div className="rounded-xl bg-muted/45 p-3 sm:p-4"><dt className="text-xs text-muted-foreground">Nominal Tagihan</dt><dd className="mt-1 font-semibold tabular-nums sm:text-lg">{currency.format(bill.totalAmount)}</dd></div>
            <div className="rounded-xl bg-muted/45 p-3 sm:p-4"><dt className="text-xs text-muted-foreground">Sudah Dibayar</dt><dd className="mt-1 font-semibold tabular-nums text-emerald-700 dark:text-emerald-300 sm:text-lg">{currency.format(bill.paidAmount)}</dd></div>
            <div className="col-span-2 rounded-xl bg-muted/45 p-3 sm:p-4 lg:col-span-1"><dt className="text-xs text-muted-foreground">Jatuh Tempo</dt><dd className={cn("mt-1 font-semibold sm:text-lg", isOverdue && "text-red-600 dark:text-red-400")}>{date.format(new Date(bill.dueDate))}</dd></div>
          </dl>

          <div>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm"><span className="text-muted-foreground">Progress pembayaran</span><strong className="tabular-nums">{paymentProgress}%</strong></div>
            <div role="progressbar" aria-label="Progress pembayaran UKT" aria-valuemin={0} aria-valuemax={bill.totalAmount} aria-valuenow={bill.paidAmount} className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full transition-[width]", isPaid ? "bg-emerald-600" : "bg-primary")} style={{ width: `${paymentProgress}%` }} />
            </div>
          </div>
        </CardContent>
        {!isPaid && (
          <CardFooter className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-xs leading-5 text-muted-foreground"><ShieldCheck className="mr-1 inline size-3.5" aria-hidden="true" />Pembayaran pada halaman ini masih berupa simulasi tanpa payment gateway.</p>
            <Button type="button" className="w-full sm:w-auto" disabled={paymentPending} onClick={() => setPaymentDialogOpen(true)}>
              {paymentPending ? <Clock3 /> : <CreditCard />}
              {paymentPending ? "Pembayaran Diproses" : "Bayar Sekarang"}
            </Button>
          </CardFooter>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,.75fr)]">
        <Card>
          <CardHeader className="border-b"><CardTitle className="flex items-center gap-2"><FileText className="size-4 text-primary" aria-hidden="true" />Detail Tagihan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {bill.items.map((item) => (
              <article key={item.id} className="rounded-xl border bg-muted/15 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div><h3 className="font-semibold">{item.type}</h3><p className="mt-1 text-sm text-muted-foreground">Periode {item.period}</p></div>
                  <StatusBadge status={item.status} />
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
                  <div><dt className="text-xs text-muted-foreground">Nominal</dt><dd className="mt-1 font-medium tabular-nums">{currency.format(item.amount)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Jatuh Tempo</dt><dd className="mt-1 font-medium">{date.format(new Date(item.dueDate))}</dd></div>
                </dl>
              </article>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b"><CardTitle className="flex items-center gap-2"><Landmark className="size-4 text-primary" aria-hidden="true" />Pembayaran Terbaru</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {paymentPending && (
              <article className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
                <div className="flex items-start justify-between gap-3"><div><p className="font-medium">Virtual Account</p><p className="mt-1 text-xs text-muted-foreground">Transaksi dummy baru</p></div><Badge variant="outline" className={paymentTone.Diproses}>Diproses</Badge></div>
                <p className="mt-3 text-lg font-semibold tabular-nums">{currency.format(remainingAmount)}</p>
              </article>
            )}
            {bill.payments.slice(0, 2).map((payment) => (
              <article key={payment.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3"><div><p className="font-medium">{payment.method}</p><p className="mt-1 text-xs text-muted-foreground">{date.format(new Date(payment.date))} · {payment.reference}</p></div><Badge variant="outline" className={paymentTone[payment.status]}>{payment.status}</Badge></div>
                <p className="mt-3 text-lg font-semibold tabular-nums">{currency.format(payment.amount)}</p>
              </article>
            ))}
          </CardContent>
          <CardFooter><Button variant="outline" className="w-full" render={<Link to="/mahasiswa/riwayat-pembayaran" />}>Lihat Semua Pembayaran<ArrowRight data-icon="inline-end" /></Button></CardFooter>
        </Card>
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><CreditCard className="size-5" aria-hidden="true" /></div>
            <DialogTitle>Mulai pembayaran UKT?</DialogTitle>
            <DialogDescription>Kamu akan membuat transaksi dummy sebesar {currency.format(remainingAmount)}. Tidak ada uang yang ditagihkan dan tidak ada payment gateway yang dihubungi.</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted/50 p-3 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">Sisa tagihan</span><strong className="tabular-nums">{currency.format(remainingAmount)}</strong></div></div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
            <Button type="button" onClick={startDummyPayment}>Lanjutkan Simulasi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
