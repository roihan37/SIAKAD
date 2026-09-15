export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | "CANCELLED"
export type PaymentMethod = "TRANSFER_BANK" | "VIRTUAL_ACCOUNT" | "CASH"
export type ReviewDecision = "APPROVE" | "REJECT" | "CANCEL"
export interface Payment {
  id: string
  paymentNumber: string
  student: { userId: string; studentId: string; nim: string; name: string; studyProgram: { id: number; name: string } }
  bill: { id: string; billNumber: string; type: string }
  amount: number
  method: PaymentMethod
  source: "MANUAL" | "PAYMENT_GATEWAY"
  paidAt: string | null
  status: PaymentStatus
}
export interface PaymentDetail extends Payment {
  bill: Payment["bill"] & { amount: number; dueDate: string; status: string; academicYear: { id: number; year: string; semester: string } }
  reference: string | null
  proofUrl: string | null
  verifiedAt: string | null
  verifiedById: string | null
  createdAt: string
  statusHistory: { id: string; previousStatus: PaymentStatus; newStatus: PaymentStatus; reason: string | null; actorId: string | null; createdAt: string }[]
}
export interface PaymentFilters {
  academicYearId?: number
  studyProgramId?: number
  method?: PaymentMethod
  status?: PaymentStatus
  search: string
  startDate?: string
  endDate?: string
}
export interface PaymentQuery extends PaymentFilters { page: number; limit: number }
export interface PaymentList {
  summary: { totalSuccessfulAmount: number; successfulTransactions: number; pendingTransactions: number; failedTransactions: number }
  payments: Payment[]
  pagination: { page: number; limit: number; totalRows: number; totalPages: number }
}
export interface PaymentOptions { years: { id: string; label: string }[]; programs: { id: string; label: string }[] }
export interface PaymentMutation { id: string; decision: ReviewDecision; reason?: string }
