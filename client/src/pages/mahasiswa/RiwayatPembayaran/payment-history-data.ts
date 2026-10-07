export type PaymentStatus =
  | "Berhasil"
  | "Menunggu"
  | "Diproses"
  | "Gagal"
  | "Kedaluwarsa"
  | "Dibatalkan"

export type PaymentBreakdown = {
  label: string
  amount: number
}

export type PaymentTransaction = {
  id: string
  transactionNumber: string
  billType: string
  academicYear: string
  date: string
  amount: number
  method: string
  status: PaymentStatus
  paymentReference: string
  paymentDeadline?: string
  failureReason?: string
  canRetry?: boolean
  breakdown?: PaymentBreakdown[]
}

export const paymentTransactions: PaymentTransaction[] = [
  {
    id: "payment-006",
    transactionNumber: "PAY-2026-100701",
    billType: "UKT Semester Ganjil",
    academicYear: "2026/2027 Ganjil",
    date: "2026-10-07T09:42:00+07:00",
    amount: 4_500_000,
    method: "Virtual Account BNI",
    status: "Menunggu",
    paymentReference: "9887610420007",
    paymentDeadline: "2026-10-08T23:59:00+07:00",
    breakdown: [
      { label: "Pembayaran UKT tahap 2", amount: 4_500_000 },
    ],
  },
  {
    id: "payment-005",
    transactionNumber: "PAY-2026-092804",
    billType: "Praktikum Laboratorium",
    academicYear: "2026/2027 Ganjil",
    date: "2026-09-28T14:18:00+07:00",
    amount: 350_000,
    method: "QRIS",
    status: "Diproses",
    paymentReference: "QR-0928-841029",
    paymentDeadline: "2026-09-28T15:18:00+07:00",
  },
  {
    id: "payment-004",
    transactionNumber: "PAY-2026-091502",
    billType: "Biaya Sertifikasi",
    academicYear: "2026/2027 Ganjil",
    date: "2026-09-15T11:05:00+07:00",
    amount: 275_000,
    method: "Virtual Account Mandiri",
    status: "Gagal",
    paymentReference: "MDR-310587412",
    failureReason: "Pembayaran tidak dapat dikonfirmasi oleh penyedia pembayaran.",
    canRetry: true,
  },
  {
    id: "payment-003",
    transactionNumber: "PAY-2026-081204",
    billType: "UKT Semester Ganjil",
    academicYear: "2026/2027 Ganjil",
    date: "2026-08-12T10:24:00+07:00",
    amount: 4_000_000,
    method: "Virtual Account BNI",
    status: "Berhasil",
    paymentReference: "BNI-20260812-41042",
    breakdown: [
      { label: "Pembayaran UKT tahap 1", amount: 4_000_000 },
    ],
  },
  {
    id: "payment-002",
    transactionNumber: "PAY-2026-071109",
    billType: "Biaya Daftar Ulang",
    academicYear: "2026/2027 Ganjil",
    date: "2026-07-11T16:40:00+07:00",
    amount: 500_000,
    method: "Virtual Account BRI",
    status: "Kedaluwarsa",
    paymentReference: "BRI-0711-108397",
  },
  {
    id: "payment-001",
    transactionNumber: "PAY-2026-070803",
    billType: "Biaya Daftar Ulang",
    academicYear: "2026/2027 Ganjil",
    date: "2026-07-08T08:15:00+07:00",
    amount: 500_000,
    method: "Virtual Account BRI",
    status: "Dibatalkan",
    paymentReference: "BRI-0708-071042",
  },
  {
    id: "payment-2025",
    transactionNumber: "PAY-2026-011506",
    billType: "UKT Semester Genap",
    academicYear: "2025/2026 Genap",
    date: "2026-01-15T13:30:00+07:00",
    amount: 8_500_000,
    method: "Virtual Account BNI",
    status: "Berhasil",
    paymentReference: "BNI-20260115-41042",
    breakdown: [
      { label: "Uang Kuliah Tunggal", amount: 8_500_000 },
    ],
  },
]
