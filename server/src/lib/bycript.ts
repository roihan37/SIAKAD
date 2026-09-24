import bcrypt from "bcryptjs"
import crypto from 'crypto';

// Generate a fresh salt for each password; synchronous helper retained for existing seed callers.
export const hashPassword = (password: string): string => {
    return bcrypt.hashSync(password, 10);
}

export const comparePassword = (password: string, hashPassword: string) => {
    return bcrypt.compare(password, hashPassword)
}

export const hashCrypto = (token : string) => {
    return crypto.createHash('sha512').update(token).digest('hex')
}
