import type { Bill, BillStatus } from "@/types/tuition"
export const statusLabels: Record<BillStatus, string> = { BELUM_DIBAYAR: "Belum Dibayar", SEBAGIAN: "Sebagian", LUNAS: "Lunas", JATUH_TEMPO: "Jatuh Tempo" }
export const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 2 }).format(value)
export const dateLabel = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`))
export function exportBills(bills: Bill[]) {
  const rows = [["Tagihan", "NIM", "Mahasiswa", "Tahun Akademik", "Nominal", "Terbayar", "Sisa", "Jatuh Tempo", "Status"], ...bills.map(bill => [bill.billNumber, bill.student.nim, bill.student.name, `${bill.academicYear.year} ${bill.academicYear.semester}`, bill.amount, bill.paidAmount, bill.remainingAmount, bill.dueDate, statusLabels[bill.status]])]
  const csv = rows.map(row => row.map(cell => { const value = String(cell); return `"${(/^[=+@\-\t\r]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"` }).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }))
  const link = document.createElement("a"); link.href = url; link.download = "tagihan-ukt.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
