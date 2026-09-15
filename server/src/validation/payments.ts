import { MetodePembayaran, StatusPembayaran } from '@prisma/client';

function invalid(message: string): never { throw { name: 'BadRequest', message }; }
function positiveInteger(value: unknown, name: string, max = 2147483647) {
  if (typeof value !== 'string' || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1 || Number(value) > max) invalid(`${name} must be a positive integer no greater than ${max}.`);
  return Number(value);
}
export function paymentId(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 100) invalid('paymentId must be a non-empty ID of at most 100 characters.');
  return value.trim();
}
function dateBoundary(value: unknown, name: string, end: boolean): Date | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) invalid(`${name} must use YYYY-MM-DD.`);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) invalid(`${name} is not a valid date.`);
  return new Date(`${value}T${end ? '23:59:59.999' : '00:00:00.000'}+07:00`);
}
export function paymentFilters(query: Record<string, unknown>) {
  const optionalId = (key: string) => query[key] === undefined ? undefined : positiveInteger(query[key], key);
  if (query.method !== undefined && !Object.values(MetodePembayaran).includes(query.method as MetodePembayaran)) invalid('Invalid payment method.');
  if (query.status !== undefined && !Object.values(StatusPembayaran).includes(query.status as StatusPembayaran)) invalid('Invalid payment status.');
  if (query.search !== undefined && (typeof query.search !== 'string' || query.search.length > 200)) invalid('search must be a string of at most 200 characters.');
  const startDate = dateBoundary(query.startDate, 'startDate', false);
  const endDate = dateBoundary(query.endDate, 'endDate', true);
  if (startDate && endDate && startDate > endDate) invalid('startDate must not be after endDate.');
  return {
    academicYearId: optionalId('academicYearId'), studyProgramId: optionalId('studyProgramId'),
    method: query.method as MetodePembayaran | undefined, status: query.status as StatusPembayaran | undefined,
    search: (query.search as string | undefined)?.trim(), startDate, endDate,
    page: query.page === undefined ? 1 : positiveInteger(query.page, 'page', 1000000),
    limit: query.limit === undefined ? 10 : positiveInteger(query.limit, 'limit', 100),
  };
}
export type PaymentFilters = ReturnType<typeof paymentFilters>;
function actionBody(body: unknown, allowed: string[]) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('Body must be a JSON object.');
  const input = body as Record<string, unknown>;
  if (Object.keys(input).some(key => !allowed.includes(key))) invalid('Body contains unsupported fields.');
  if (input.reason !== undefined && (typeof input.reason !== 'string' || !input.reason.trim() || input.reason.length > 2000)) invalid('reason must be non-empty text of at most 2000 characters.');
  return input;
}
export function verifyPaymentBody(body: unknown) {
  const input = actionBody(body, ['decision', 'reason']);
  if (input.decision !== 'APPROVE' && input.decision !== 'REJECT') invalid('decision must be APPROVE or REJECT.');
  return { decision: input.decision, reason: (input.reason as string | undefined)?.trim() } as const;
}
export function cancelPaymentBody(body: unknown) {
  const input = actionBody(body, ['reason']);
  if (input.reason === undefined) invalid('reason is required.');
  return { reason: (input.reason as string).trim() };
}
