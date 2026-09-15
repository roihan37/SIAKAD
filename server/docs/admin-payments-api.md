# Admin payment API

All endpoints use the existing authentication and admin middleware:

| Method | Path | Controller |
| --- | --- | --- |
| GET | `/api/v1/admin/payments` | `getPayments` |
| GET | `/api/v1/admin/payments/:paymentId` | `getPaymentById` |
| PATCH | `/api/v1/admin/payments/:paymentId/verify` | `verifyPayment` |
| PATCH | `/api/v1/admin/payments/:paymentId/cancel` | `cancelPayment` |

List queries accept optional `academicYearId`, `studyProgramId`, `method`, `status`, `search`, `startDate`, `endDate`, `page` (default 1), and `limit` (default 10, maximum 100). Dates use valid YYYY-MM-DD calendar dates, inclusive in Asia/Jakarta, against **payment createdAt**, allowing pending payments without paidAt to be filtered. Search covers payment number, reference, bill number, NIM, and student name. Results are ordered by creation time descending then ID ascending.

The response is `{ message, data: { summary, payments, pagination } }`. Summary follows every filter except status and pagination. `failedTransactions` counts FAILED only, not EXPIRED or CANCELLED. Successful totals include SUCCESS only. Unmatched filters return zero totals and an empty list. Numeric amounts are JSON numbers. DateTime values serialize as ISO timestamps; absent values remain null.

List student fields are `userId`, `studentId` (Mahasiswa.id), `nim`, `name`, and `studyProgram: { id, name }`. Bill fields are `id`, `billNumber`, and `type: "UKT"`; the type reflects the TagihanUKT model and does not require a schema column. Nullable `sumber` maps directly to `source` without inferring a gateway or manual origin.

Detail returns `{ message, data }`, adding bill amount, due date, stored status, academic year, reference, proofUrl, verification metadata, createdAt, and statusHistory. History fields are `id`, `previousStatus`, `newStatus`, `reason`, `actorId`, and `createdAt`, ordered newest first. `proofUrl` uses the existing five-minute signed S3 read URL; the internal key is not exposed. Signing happens after the read transaction completes.

Verification accepts `{ "decision": "APPROVE" | "REJECT", "reason"?: "..." }`. Cancellation accepts `{ "reason": "..." }`. Reasons, when present, must be non-empty and at most 2000 characters. Unsupported body fields are rejected, including client-provided status or actor metadata.

Only PENDING payments can be verified or cancelled. No successful-payment reversal policy exists in this project, so SUCCESS, FAILED, EXPIRED, and CANCELLED cannot be cancelled by this endpoint. Cancelling a successful payment would require an explicitly defined refund/reversal workflow. Repeated or competing transitions return 409 rather than producing duplicate histories.

Verify/cancel return `{ message, data: { id, status } }`. APPROVE sets SUCCESS, verifiedAt, verifiedById, and paidAt (preserving an existing payment timestamp). REJECT sets FAILED and verification metadata. CANCEL sets CANCELLED and records the admin actor in history without marking the payment verified. Actor IDs always come from the authenticated admin.

Mutations use serializable transactions and a conditional PENDING update. Status changes and history insertion are atomic. Approval also recalculates the bill inside that transaction: zero successful amount = BELUM_DIBAYAR; below nominal = SEBAGIAN; at least nominal = LUNAS. This stored status follows the requested balance rule; tuition list APIs may separately derive JATUH_TEMPO from the due date. Serialization conflicts use the existing Prisma P2034 handler (409); clients should reload before retrying.

No schema changes or database data writes were performed during implementation. Prisma Client was regenerated for the existing schema. Validation: `npx tsc --noEmit` and `node -r ts-node/register/transpile-only tests/payments.cjs`. Tests use mocks; live PostgreSQL concurrency and S3 credentials were not tested.
