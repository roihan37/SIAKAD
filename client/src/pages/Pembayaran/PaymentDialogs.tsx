import { useState } from "react"
import { ExternalLink, FileText, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { AcademicFilterSelect } from "@/components/academic/AcademicFilterSelect"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import type { PaymentDetail as Detail, ReviewDecision } from "@/types/payments"
import { PaymentBadge } from "./PaymentTable"
import { canReview, dateLabel, money, methodLabels } from "./payment-format"

function Evidence({ payment }: { payment: Detail }) {
  const proofUrl = payment.proofUrl && /^https?:\/\//i.test(payment.proofUrl) ? payment.proofUrl : null
  return <section className="rounded-lg border border-dashed p-4"><p className="flex items-center gap-2 text-sm font-medium"><FileText className="size-4" />Bukti Pembayaran</p>{proofUrl ? <a className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-4" href={proofUrl} target="_blank" rel="noopener noreferrer">Buka bukti pembayaran<ExternalLink className="size-4" /></a> : <p className="mt-2 text-sm text-muted-foreground">Bukti pembayaran tidak tersedia.</p>}</section>
}
export function PaymentLoadState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  return loading ? <div role="status" aria-label="Memuat detail pembayaran" className="space-y-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)}</div> : <div role="alert" className="space-y-3 py-8 text-center"><p className="text-sm text-destructive">{error ?? "Detail pembayaran belum tersedia."}</p><Button variant="outline" onClick={onRetry}>Coba Lagi</Button></div>
}
interface DetailProps { payment: Detail | null; loading: boolean; error: string | null; onRetry: () => void; onClose: () => void }
export function PaymentDetail({ payment, loading, error, onRetry, billOnly, onClose }: DetailProps & { billOnly: boolean }) {
  const fields = payment ? [["No Transaksi", payment.paymentNumber], ["No Tagihan", payment.bill.billNumber], ["Jenis Tagihan", payment.bill.type], ["Tahun Akademik", `${payment.bill.academicYear.year} ${payment.bill.academicYear.semester}`], ["Nominal Tagihan", money(payment.bill.amount)], ["Nominal Transaksi", money(payment.amount)], ["Metode", methodLabels[payment.method]], ["Dibayar Pada (WIB)", dateLabel(payment.paidAt)], ["Dibuat Pada (WIB)", dateLabel(payment.createdAt)], ["Reference / Payment Code", payment.reference ?? "—"]] : []
  return <Sheet open onOpenChange={open => { if (!open) onClose() }}><SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg"><SheetHeader><SheetTitle>{billOnly ? "Detail Tagihan Terkait" : "Detail Pembayaran"}</SheetTitle><SheetDescription>{payment?.paymentNumber ?? "Informasi transaksi pembayaran mahasiswa."}</SheetDescription></SheetHeader>
    <div className="space-y-6 px-6 pb-6">{loading || error || !payment ? <PaymentLoadState loading={loading} error={error} onRetry={onRetry} /> : <><div className="rounded-lg bg-muted/50 p-4"><p className="font-semibold">{payment.student.name}</p><p className="mt-1 text-sm text-muted-foreground">{payment.student.nim} · {payment.student.studyProgram.name}</p><div className="mt-3"><PaymentBadge status={payment.status} /></div></div>
      <dl className="grid gap-4 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm font-medium">{value}</dd></div>)}</dl>
      {billOnly ? <p className="text-xs text-muted-foreground">Status di atas merupakan status transaksi, bukan status pelunasan seluruh tagihan. Jatuh tempo tagihan: {dateLabel(payment.bill.dueDate)}.</p> : <><p className="text-sm text-muted-foreground">{payment.source === "PAYMENT_GATEWAY" ? "Transaksi otomatis melalui payment gateway." : "Transaksi manual, diverifikasi oleh admin."}</p><Evidence payment={payment} /><section><h3 className="text-sm font-semibold">Riwayat Status Transaksi</h3>{payment.statusHistory.length ? <ol className="mt-3 space-y-4 border-l pl-4">{payment.statusHistory.map(entry => <li key={entry.id}><PaymentBadge status={entry.newStatus} /><p className="mt-1 text-xs text-muted-foreground">{dateLabel(entry.createdAt)}</p>{entry.reason && <p className="mt-1 break-words text-sm">{entry.reason}</p>}</li>)}</ol> : <p className="mt-3 text-sm text-muted-foreground">Belum ada riwayat perubahan status.</p>}</section></>}
      <Button variant="outline" className="w-full" onClick={onClose}>Tutup</Button></>}
    </div></SheetContent></Sheet>
}
export function PaymentReview({ payment, loading, error, onRetry, cancel, pending, mutationError, onClose, onSave }: DetailProps & { cancel: boolean; pending: boolean; mutationError: string | null; onSave: (decision: ReviewDecision, reason: string) => Promise<void> }) {
  const [decision, setDecision] = useState<ReviewDecision>(cancel ? "CANCEL" : "APPROVE")
  const [reason, setReason] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const needsReason = decision !== "APPROVE"
  const label = decision === "APPROVE" ? "Setujui" : decision === "REJECT" ? "Tolak" : "Batalkan"
  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose() }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{cancel ? "Batalkan Pembayaran" : "Verifikasi Pembayaran"}</DialogTitle><DialogDescription>Periksa transaksi dan bukti pembayaran sebelum mengonfirmasi keputusan.</DialogDescription></DialogHeader>
    {loading || error || !payment ? <PaymentLoadState loading={loading} error={error} onRetry={onRetry} /> : <form className="space-y-4" onSubmit={event => { event.preventDefault(); if (confirmed && !pending && canReview(payment) && (!needsReason || reason.trim())) { setConfirmed(false); void onSave(decision, reason.trim()) } }}>
      <div className="space-y-1 rounded-lg bg-muted/50 p-4"><p className="font-semibold">{payment.student.name}</p><p className="text-xs text-muted-foreground">{payment.student.nim} · {payment.paymentNumber}</p><p className="pt-2 text-lg font-semibold">{money(payment.amount)}</p><p className="text-sm text-muted-foreground">{methodLabels[payment.method]}</p><PaymentBadge status={payment.status} /></div><Evidence payment={payment} />
      {!canReview(payment) && <p role="alert" className="text-sm text-muted-foreground">Transaksi ini tidak dapat diverifikasi atau dibatalkan secara manual.</p>}
      {!cancel && <AcademicFilterSelect label="Keputusan" required value={decision} disabled={pending} options={[{ id: "APPROVE", label: "Setujui" }, { id: "REJECT", label: "Tolak" }]} onChange={value => { if (value === "APPROVE" || value === "REJECT") setDecision(value); setConfirmed(false) }} />}
      {needsReason && <div className="space-y-2"><label htmlFor="payment-reason" className="text-sm font-medium">Alasan {cancel ? "pembatalan" : "penolakan"} *</label><Textarea id="payment-reason" required disabled={pending} maxLength={2000} rows={3} value={reason} onChange={event => { setReason(event.target.value); setConfirmed(false) }} placeholder="Tuliskan alasan yang jelas..." /></div>}
      <label className="flex items-start gap-3 rounded-lg border p-3 text-sm"><Checkbox disabled={pending || !canReview(payment)} checked={confirmed} onCheckedChange={checked => setConfirmed(checked === true)} aria-label="Konfirmasi keputusan pembayaran" /><span>Saya telah memeriksa transaksi {payment.paymentNumber} dan mengonfirmasi keputusan: <strong>{label}</strong>.</span></label>
      {mutationError && <p role="alert" className="text-sm text-destructive">{mutationError}</p>}
      <DialogFooter><Button type="button" variant="outline" disabled={pending} onClick={onClose}>Batal</Button><Button type="submit" variant={needsReason ? "destructive" : "default"} disabled={pending || !confirmed || (needsReason && !reason.trim()) || !canReview(payment)}>{pending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}{pending ? "Memproses..." : `${label} Pembayaran`}</Button></DialogFooter>
    </form>}</DialogContent></Dialog>
}
