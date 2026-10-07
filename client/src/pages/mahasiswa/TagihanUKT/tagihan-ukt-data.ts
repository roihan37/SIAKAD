export type TuitionStatus = "Belum Dibayar" | "Sebagian" | "Lunas" | "Jatuh Tempo"
export type PaymentStatus = "Berhasil" | "Diproses" | "Gagal"

export type TuitionItem = {
  id: string
  type: string
  period: string
  amount: number
  dueDate: string
  status: TuitionStatus
}

export type PaymentHistory = {
  id: string
  reference: string
  date: string
  method: string
  amount: number
  status: PaymentStatus
}

export const tuitionBill = {
  academicYear: "2026/2027 Ganjil",
  invoiceNumber: "UKT-2026-071042",
  status: "Sebagian" as TuitionStatus,
  totalAmount: 8_500_000,
  paidAmount: 4_000_000,
  dueDate: "2026-11-15T16:59:59+07:00",
  items: [
    {
      id: "bill-ukt-2026",
      type: "Uang Kuliah Tunggal (UKT)",
      period: "2026/2027 Ganjil",
      amount: 8_500_000,
      dueDate: "2026-11-15T16:59:59+07:00",
      status: "Sebagian" as TuitionStatus,
    },
  ] satisfies TuitionItem[],
  payments: [
    {
      id: "payment-001",
      reference: "PAY-2026-081204",
      date: "2026-08-12T10:24:00+07:00",
      method: "Virtual Account BNI",
      amount: 4_000_000,
      status: "Berhasil",
    },
  ] satisfies PaymentHistory[],
}
