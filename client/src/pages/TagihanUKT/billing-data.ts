export const periods = ["2026/2027 Ganjil", "2025/2026 Genap"]
export const statuses = ["Belum Dibayar", "Sebagian", "Lunas", "Jatuh Tempo", "Dibatalkan"] as const
export type Student = { id: string; nim: string; name: string; prodi: string; angkatan: number }
export type Payment = { id: string; date: string; amount: number; method: string }
export type Bill = { id: string; student: Student; period: string; amount: number; due: string; note: string; payments: Payment[]; cancellation?: string }
export const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value)
export const dateLabel = (value: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(value))
export const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
export function relativeDate(days: number) { const date = new Date(`${today()}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10) }
export const paid = (bill: Bill) => bill.payments.reduce((sum, payment) => sum + payment.amount, 0)
export const remaining = (bill: Bill) => Math.max(0, bill.amount - paid(bill))
export function statusOf(bill: Bill): typeof statuses[number] {
  if (bill.cancellation) return "Dibatalkan"
  if (remaining(bill) === 0) return "Lunas"
  if (bill.due < today()) return "Jatuh Tempo"
  return paid(bill) ? "Sebagian" : "Belum Dibayar"
}
export const canCancel = (bill: Bill) => !bill.cancellation && paid(bill) === 0
export const canEdit = (bill: Bill) => !bill.cancellation && remaining(bill) > 0
export const students: Student[] = ["Andi Pratama", "Budi Saputra", "Citra Lestari", "Dewi Anggraini", "Eka Putra", "Farah Aulia", "Gilang Ramadhan", "Hana Safitri", "Indra Maulana", "Jihan Putri", "Kevin Aditya", "Laras Wulandari", "Muhammad Rizki", "Nadia Zahra", "Oki Firmansyah", "Putri Amanda", "Rafi Alamsyah", "Salsa Nabila", "Taufik Hidayat", "Vina Maharani", "Wahyu Putra", "Zahra Aulia", "Yoga Pratama", "Yuni Lestari"].map((name, i) => ({ id: `student-${i}`, nim: `${2023 + i % 3}${String(i + 1).padStart(4, "0")}`, name, prodi: i % 2 ? "Sistem Informasi" : "Teknik Informatika", angkatan: 2023 + i % 3 }))
export function createBills(): Bill[] {
  return periods.flatMap((period, p) => students.slice(0, p ? 12 : 18).map((student, i) => ({ id: `UKT-${p}-${i + 1}`, student, period, amount: 4500000 + (i % 3) * 500000, due: relativeDate(i % 5 === 3 ? -10 : 20), note: "Tagihan UKT semester reguler", cancellation: i % 5 === 4 ? "Mahasiswa mengajukan penundaan studi." : undefined,
    payments: i % 5 === 1 || i % 5 === 2 ? [{ id: `PAY-${p}-${i}`, date: relativeDate(-15), amount: i % 5 === 2 ? 4500000 + (i % 3) * 500000 : 1500000, method: "Transfer bank" }] : [],
  })))
}
export function generationTargets(bills: Bill[], period: string, target: string, prodi: string, angkatan: string) {
  return students.filter((student) => (target === "Semua Mahasiswa" || (prodi === "Semua" || student.prodi === prodi) && (angkatan === "Semua" || String(student.angkatan) === angkatan)) && !bills.some((bill) => bill.student.id === student.id && bill.period === period && !bill.cancellation))
}
export function exportBills(bills: Bill[]) {
  const rows = [["Tagihan", "NIM", "Mahasiswa", "Prodi", "Tahun Akademik", "Nominal", "Terbayar", "Sisa", "Jatuh Tempo", "Status"], ...bills.map((bill) => [bill.id, bill.student.nim, bill.student.name, bill.student.prodi, bill.period, bill.amount, paid(bill), remaining(bill), bill.due, statusOf(bill)])]
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n")
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }))
  const link = document.createElement("a"); link.href = url; link.download = "tagihan-ukt.csv"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
}
