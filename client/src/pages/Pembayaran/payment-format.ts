import type { Payment, PaymentStatus, PaymentMethod } from "@/types/payments"
export const statusLabels: Record<PaymentStatus, string> = { SUCCESS: "Berhasil", PENDING: "Menunggu Verifikasi", FAILED: "Gagal", EXPIRED: "Kedaluwarsa", CANCELLED: "Dibatalkan" }
export const methodLabels: Record<PaymentMethod, string> = { TRANSFER_BANK: "Transfer Bank", VIRTUAL_ACCOUNT: "Virtual Account", CASH: "Tunai" }
// No gateway review flag exists in the API; never infer permission from method.
export const canReview = (payment: Payment) => payment.status === "PENDING" && payment.source === "MANUAL"
export const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
export const dateLabel = (value: string | null) => value ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Jakarta" }).format(new Date(value)) : "—"
export function exportPayments(payments: Payment[]) {
  const rows = [["No Transaksi", "NIM", "Mahasiswa", "Prodi", "Jenis Tagihan", "Nominal Dibayar", "Metode", "Tanggal", "Status"], ...payments.map(row => [row.paymentNumber, row.student.nim, row.student.name, row.student.studyProgram.name, row.bill.type, row.amount, methodLabels[row.method], row.paidAt ?? "", statusLabels[row.status]])]
  const csv = rows.map(row => row.map(cell => { const value = String(cell); return `"${(/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"` }).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }))
  const link = document.createElement("a"); link.href = url; link.download = "pembayaran.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
