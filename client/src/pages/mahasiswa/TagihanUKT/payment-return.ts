import type { StudentPayment } from "@/types/student-payments"

export interface MidtransReturnContext {
  orderId: string
  action: "back" | null
  transactionStatus: string | null
}

export function parseMidtransReturn(search: string): MidtransReturnContext | null {
  const params = new URLSearchParams(search)
  const orderId = params.get("order_id")?.trim()
  if (!orderId || orderId.length > 100) return null

  return {
    orderId,
    action: params.get("action") === "back" ? "back" : null,
    transactionStatus: params.get("transaction_status")?.trim().toLowerCase() || null,
  }
}

export function findReturnedPayment(
  payments: StudentPayment[],
  context: MidtransReturnContext | null,
) {
  if (!context) return null
  return payments.find((payment) => payment.providerOrderId === context.orderId) ?? null
}

export function shouldRecheckReturnedPayment(
  payment: StudentPayment | null,
  context: MidtransReturnContext | null,
) {
  return payment?.status === "PENDING"
    && context?.action !== "back"
    && Boolean(context)
}
