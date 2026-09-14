import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { Bill } from "@/types/tuition"
import { BillingStatus } from "./BillingTable"
import { dateLabel, money } from "./billing-format"
export function BillingDetailSheet({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  return <Sheet open onOpenChange={open => { if (!open) onClose() }}>
    <SheetContent className="overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-lg">
      <SheetHeader><SheetTitle>Detail Tagihan</SheetTitle><SheetDescription>{bill.billNumber} · {bill.academicYear.year} {bill.academicYear.semester}</SheetDescription></SheetHeader>
      <div className="space-y-6 px-6 pb-6">
        <div className="rounded-lg bg-muted/50 p-4"><p className="font-semibold">{bill.student.name}</p><p className="mt-1 text-sm text-muted-foreground">{bill.student.nim}</p><div className="mt-3"><BillingStatus bill={bill} /></div></div>
        <dl className="grid grid-cols-2 gap-4">{[["Nominal", money(bill.amount)], ["Terbayar", money(bill.paidAmount)], ["Sisa", money(bill.remainingAmount)], ["Jatuh Tempo", dateLabel(bill.dueDate)]].map(([label, value]) => <div key={label}><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>)}</dl>
        <section><h3 className="font-semibold">Riwayat Pembayaran</h3><p className="mt-3 rounded-lg border p-4 text-sm text-muted-foreground">Rincian riwayat pembayaran belum tersedia.</p></section>
        <Button variant="outline" className="w-full" onClick={onClose}>Tutup</Button>
      </div>
    </SheetContent>
  </Sheet>
}
