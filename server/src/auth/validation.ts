export function credentials(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw { name: 'BadRequest', message: 'Invalid credentials.' };
  const { identifier, password } = body as Record<string, unknown>;
  if (typeof identifier !== 'string' || !identifier.trim() || identifier.length > 254 || typeof password !== 'string' || !password || Buffer.byteLength(password) > 72) throw { name: 'BadRequest', message: 'A valid identifier and password are required.' };
  return { identifier: identifier.trim(), password };
}
export function newPassword(value: unknown): string {
  if (typeof value !== 'string' || value.length < 12 || Buffer.byteLength(value) > 72) throw { name: 'BadRequest', message: 'Password must be at least 12 characters and at most 72 bytes.' };
  return value;
}
