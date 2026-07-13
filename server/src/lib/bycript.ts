import bcrypt from "bcryptjs"

const salt = bcrypt.genSaltSync(10);
export const hashPassword = (password: string): string => {
    return bcrypt.hashSync(password, salt);
}

export const comparePassword = (password: string, hashPassword: string) => {
    return bcrypt.compareSync(password, hashPassword)
}
