-- Add nullable gateway metadata so existing manual payments remain compatible.
ALTER TABLE "PembayaranUKT"
ADD COLUMN "provider" TEXT,
ADD COLUMN "providerOrderId" TEXT,
ADD COLUMN "providerTransactionId" TEXT,
ADD COLUMN "providerToken" TEXT,
ADD COLUMN "providerRedirectUrl" TEXT,
ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "PembayaranUKT_providerOrderId_key"
ON "PembayaranUKT"("providerOrderId");

CREATE UNIQUE INDEX "PembayaranUKT_providerTransactionId_key"
ON "PembayaranUKT"("providerTransactionId");

CREATE INDEX "PembayaranUKT_provider_status_idx"
ON "PembayaranUKT"("provider", "status");

-- The database enforces one active gateway checkout per bill, including races.
CREATE UNIQUE INDEX "PembayaranUKT_one_pending_gateway_per_bill_key"
ON "PembayaranUKT"("tagihanId")
WHERE "status" = 'PENDING' AND "sumber" = 'PAYMENT_GATEWAY';
