import crypto from 'crypto';
import { AccessClaims, createTokenJwt } from './jwt';
export const generateRefreshToken = () => crypto.randomBytes(32).toString('base64url');
export const generateAccessToken = (claims: AccessClaims) => createTokenJwt(claims);
