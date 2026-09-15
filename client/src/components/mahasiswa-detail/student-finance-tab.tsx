import { useEffect, useState } from "react"
import { ArrowLeft, Wallet } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/hooks/redux"
import { getStudentFinance } from "@/features/action/studentFinanceThunk"
import { clearStudentFinance } from "@/features/slice/studentFinanceSlice"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { money, dateLabel, statusLabels } from "@/pages/TagihanUKT/billing-format"
import type { StudentFinanceBill } from "@/types/student-finance"

const paymentStatuses = { PENDING: "Menunggu", SUCCESS: "Berhasil", FAILED: "Gagal", EXPIRED: "Kedaluwarsa", CANCELLED: "Dibatalkan" }
const paymentMethods = { TRANSFER_BANK: "Transfer Bank", VIRTUAL_ACCOUNT: "Virtual Account", CASH: "Tunai" }
const paymentDate = (value: string | null) => value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)) : "—"

function FinanceBillDetail({ bill, onBack }: { bill: StudentFinanceBill; onBack: () => void }) {
  return <div className="space-y-5">
    <Button variant="ghost" className="-ml-2 text-muted-foreground" onClick={onBack}><ArrowLeft />Kembali ke tagihan</Button>
    <Card><CardHeader><CardTitle>Detail Tagihan</CardTitle><p className="text-sm text-muted-foreground">{bill.billNumber} · {bill.academicYear.year} {bill.academicYear.semester}</p></CardHeader>
      <CardContent><dl className="grid gap-4 sm:grid-cols-2">{[["Total Tagihan", money(bill.amount)], ["Sudah Dibayar", money(bill.paidAmount)], ["Sisa", money(bill.remainingAmount)], ["Jatuh Tempo", dateLabel(bill.dueDate)], ["Status", statusLabels[bill.status]]].map(([label, value]) => <div key={label} className="space-y-1 border-b border-border/60 pb-3"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="text-sm font-medium">{value}</dd></div>)}</dl></CardContent>
    </Card>
    <Card><CardHeader><CardTitle>Riwayat Pembayaran</CardTitle><p className="text-sm text-muted-foreground">Hanya pembayaran berhasil yang dihitung sebagai sudah dibayar.</p></CardHeader><CardContent className="p-0">
      <Table><TableHeader><TableRow>{["Nomor Pembayaran", "Tanggal Pembayaran (WIB)", "Metode", "Nominal", "Status"].map(label => <TableHead key={label} className="px-6">{label}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{bill.payments.length ? bill.payments.map(payment => <TableRow key={payment.id}><TableCell className="px-6">{payment.paymentNumber}</TableCell><TableCell className="px-6">{paymentDate(payment.paidAt)}</TableCell><TableCell className="px-6">{paymentMethods[payment.method]}</TableCell><TableCell className="px-6 tabular-nums">{money(payment.amount)}</TableCell><TableCell className="px-6"><Badge variant={payment.status === "FAILED" ? "destructive" : "secondary"}>{paymentStatuses[payment.status]}</Badge></TableCell></TableRow>) : <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Belum ada riwayat pembayaran.</TableCell></TableRow>}</TableBody>
      </Table>
    </CardContent></Card>
  </div>
}

export function StudentFinanceTab({ studentId }: { studentId: string }) {
  const dispatch = useAppDispatch()
  const finance = useAppSelector(state => state.studentFinance)
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null)
  useEffect(() => {
    const request = dispatch(getStudentFinance(studentId))
    return () => { request.abort(); dispatch(clearStudentFinance()) }
  }, [dispatch, studentId])
  const loading = finance.loading || finance.studentId !== studentId
  if (loading) return <div role="status" aria-label="Memuat keuangan mahasiswa" className="space-y-5"><Card><CardHeader><CardTitle>Keuangan</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-24" />)}</CardContent></Card><Card><CardContent className="space-y-4 pt-6">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-12" />)}</CardContent></Card></div>
  if (finance.error) return <Card><CardContent className="space-y-3 py-10 text-center" role="alert"><p className="font-medium">Keuangan mahasiswa gagal dimuat</p><p className="text-sm text-destructive">{finance.error}</p><Button variant="outline" onClick={() => dispatch(getStudentFinance(studentId))}>Coba Lagi</Button></CardContent></Card>
  if (!finance.data) return <p className="py-10 text-center text-muted-foreground">Data keuangan belum tersedia.</p>
  const { summary, bills } = finance.data
  const selectedBill = bills.find(bill => bill.id === selectedBillId)
  if (selectedBill) return <FinanceBillDetail bill={selectedBill} onBack={() => setSelectedBillId(null)} />
  return <div className="space-y-5">
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="size-4 text-muted-foreground" />Keuangan</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3">
      {[["Total Tagihan", summary.totalBills], ["Sudah Dibayar", summary.totalPaid], ["Sisa", summary.totalOutstanding]].map(([label, value]) => <div key={label} className="rounded-lg bg-muted/50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold tabular-nums">{money(Number(value))}</p></div>)}
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Riwayat Tagihan</CardTitle><p className="text-sm text-muted-foreground">Seluruh tahun akademik. Pilih tagihan untuk melihat riwayat pembayaran.</p></CardHeader><CardContent className="p-0">
      <Table><TableHeader><TableRow className="bg-muted/40">{["Tahun Akademik", "Nomor Tagihan", "Tagihan", "Dibayar", "Sisa", "Jatuh Tempo", "Status"].map(label => <TableHead key={label} className="px-6">{label}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{bills.length ? bills.map(bill => <TableRow key={bill.id}><TableCell className="px-6">{bill.academicYear.year} {bill.academicYear.semester}</TableCell><TableCell className="px-6"><button type="button" className="font-medium text-primary underline-offset-4 hover:underline focus-visible:underline" onClick={() => setSelectedBillId(bill.id)}>{bill.billNumber}</button></TableCell><TableCell className="px-6 tabular-nums">{money(bill.amount)}</TableCell><TableCell className="px-6 tabular-nums">{money(bill.paidAmount)}</TableCell><TableCell className="px-6 tabular-nums">{money(bill.remainingAmount)}</TableCell><TableCell className="px-6">{dateLabel(bill.dueDate)}</TableCell><TableCell className="px-6"><Badge variant={bill.status === "JATUH_TEMPO" ? "destructive" : "secondary"}>{statusLabels[bill.status]}</Badge></TableCell></TableRow>) : <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Belum ada tagihan untuk mahasiswa ini.</TableCell></TableRow>}</TableBody>
      </Table>
    </CardContent></Card>
  </div>
}
