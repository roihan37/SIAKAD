import { prisma } from '../../src/lib/prisma';
import { S3Service } from '../../src/services/s3.service';

// Optional storage fixture. Never attach a key before the upload succeeds.
export async function seedPaymentProof() {
  const payment = await prisma.pembayaranUKT.findFirst({
    where: { nomorPembayaran: { startsWith: 'PAY-SEED-' }, sumber: 'MANUAL', status: 'PENDING' },
    orderBy: { nomorPembayaran: 'asc' }, select: { id: true, nomorPembayaran: true, buktiPembayaranKey: true },
  });
  if (!payment) return;
  const key = `seed/payment-proofs/${payment.id}.txt`;
  if (payment.buktiPembayaranKey && payment.buktiPembayaranKey !== key) return;
  const url = await S3Service.createUploadUrl(key, 'text/plain');
  const response = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'text/plain' },
    body: `SIAKAD DEMO PAYMENT PROOF\nPayment: ${payment.nomorPembayaran}\nDevelopment fixture only. Not a bank receipt or proof of actual funds.\n`,
  });
  if (!response.ok) throw new Error(`Demo payment proof upload failed: ${response.status}`);
  await prisma.pembayaranUKT.update({ where: { id: payment.id }, data: { buktiPembayaranKey: key } });
}
