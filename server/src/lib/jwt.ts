import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import { jwtSecret } from '../auth/config';
export interface AccessClaims { id: string; role: Role; sid: string }
const options = { issuer: 'siakad', audience: 'siakad-api', algorithms: ['HS256'] as jwt.Algorithm[] };
export function decoded(token: string): AccessClaims {
  const payload = jwt.verify(token, jwtSecret(), options);
  if (typeof payload === 'string' || typeof payload.id !== 'string' || !payload.id || typeof payload.sid !== 'string' || !payload.sid || !Object.values(Role).includes(payload.role)) {
    throw { name: 'TokenInvalid' };
  }
  return { id: payload.id, role: payload.role, sid: payload.sid };
}
export function createTokenJwt(payload: AccessClaims) {
  // Explicit allowlist prevents password hashes and profile data entering JWTs.
  return jwt.sign({ id: payload.id, role: payload.role, sid: payload.sid }, jwtSecret(), {
    algorithm: 'HS256', issuer: options.issuer, audience: options.audience, expiresIn: '15m',
  });
}
