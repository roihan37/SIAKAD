import type { Payment, PaymentStatus } from "@/types/payments"
import { Eye, MoreHorizontal, Receipt, ShieldCheck, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { canReview, dateLabel, money, statusLabels, methodLabels } from "./payment-format"
const statusColors: Record<PaymentStatus, string> = {
  SUCCESS: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  PENDING: "bg-amber-500/10 text-amber-800 dark:text-amber-400",
  FAILED: "bg-red-500/10 text-red-700 dark:text-red-400",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
}
export function PaymentBadge({ status }: { status: PaymentStatus }) { return <Badge variant="secondary" className={statusColors[status]}>{statusLabels[status]}</Badge> }
export function PaymentTable({ rows, onDetail, onBill, onReview }: { rows: Payment[]; onDetail: (id: string) => void; onBill: (id: string) => void; onReview: (id: string, cancel?: boolean) => void }) {
  return <Table><TableHeader><TableRow className="bg-muted/40">{["No Transaksi", "NIM", "Mahasiswa", "Jenis Tagihan", "Nominal Dibayar", "Metode", "Dibayar Pada (WIB)", "Status", "Aksi"].map(label => <TableHead key={label} className="px-4 py-3">{label}</TableHead>)}</TableRow></TableHeader>
    <TableBody>{rows.length ? rows.map(row => <TableRow key={row.id}>
      <TableCell className="px-4 font-mono text-xs">{row.paymentNumber}</TableCell><TableCell className="px-4 font-mono text-xs">{row.student.nim}</TableCell><TableCell className="px-4"><p className="font-medium">{row.student.name}</p><p className="text-xs text-muted-foreground">{row.student.studyProgram.name}</p></TableCell><TableCell className="px-4">{row.bill.type}</TableCell><TableCell className="px-4 tabular-nums">{money(row.amount)}</TableCell><TableCell className="px-4">{methodLabels[row.method]}{row.source === "PAYMENT_GATEWAY" && <p className="text-xs text-muted-foreground">Gateway · {canReview(row) ? "Perlu review" : "Otomatis"}</p>}</TableCell><TableCell className="px-4 whitespace-nowrap">{dateLabel(row.paidAt)}</TableCell><TableCell className="px-4"><PaymentBadge status={row.status} /></TableCell>
      <TableCell className="px-4"><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={`Aksi ${row.id}`}><MoreHorizontal /></Button>} /><DropdownMenuContent align="end"><DropdownMenuGroup>
        <DropdownMenuItem onClick={() => onDetail(row.id)}><Eye />Lihat Detail</DropdownMenuItem><DropdownMenuItem onClick={() => onBill(row.id)}><Receipt />Lihat Tagihan</DropdownMenuItem>
        {canReview(row) && <><DropdownMenuItem onClick={() => onReview(row.id)}><ShieldCheck />Verifikasi Pembayaran</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => onReview(row.id, true)}><XCircle />Batalkan Pembayaran</DropdownMenuItem></>}
      </DropdownMenuGroup></DropdownMenuContent></DropdownMenu></TableCell>
    </TableRow>) : <TableRow><TableCell colSpan={9} className="h-40 text-center"><p className="font-medium">Tidak ada transaksi ditemukan</p><p className="mt-1 text-sm text-muted-foreground">Ubah tahun akademik atau reset filter untuk melihat transaksi.</p></TableCell></TableRow>}</TableBody>
  </Table>
}
