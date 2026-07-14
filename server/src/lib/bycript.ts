import bcrypt from "bcryptjs"
import crypto from 'crypto';

const salt = bcrypt.genSaltSync(10);
export const hashPassword = (password: string): string => {
    return bcrypt.hashSync(password, salt);
}

export const comparePassword = (password: string, hashPassword: string) => {
    return bcrypt.compareSync(password, hashPassword)
}

export const hashCrypto = (token : string) => {
    return crypto.createHash('sha512').update(token).digest('hex')
}
