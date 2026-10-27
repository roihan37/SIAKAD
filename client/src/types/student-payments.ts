export type StudentPaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | "CANCELLED"

export interface StudentPayment {
  id: string
  paymentNumber: string
  amount: number
  method: "TRANSFER_BANK" | "VIRTUAL_ACCOUNT" | "CASH"
  status: StudentPaymentStatus
  source: string | null
  reference: string | null
  paidAt: string | null
  createdAt: string
  bill: {
    id: string
    billNumber: string
    amount: number
    dueDate: string
    status: string
    academicYear: { id: number; year: string; semester: "GANJIL" | "GENAP" }
  }
}

export interface StudentPaymentsResponse {
  summary: { totalPayments: number; successful: number; pending: number; totalPaid: number }
  payments: StudentPayment[]
}

export type PaymentStatus = "Berhasil" | "Menunggu" | "Gagal" | "Kedaluwarsa" | "Dibatalkan"

export interface PaymentTransaction {
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
}
