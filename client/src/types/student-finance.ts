import type { Bill } from "./tuition"
export type StudentFinanceBill = Omit<Bill, "student"> & {
  payments: { id: string; paymentNumber: string; amount: number; method: "TRANSFER_BANK" | "VIRTUAL_ACCOUNT" | "CASH"; status: "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | "CANCELLED"; paidAt: string | null }[]
}
export interface StudentFinance {
  summary: { totalBills: number; totalPaid: number; totalOutstanding: number }
  bills: StudentFinanceBill[]
}
