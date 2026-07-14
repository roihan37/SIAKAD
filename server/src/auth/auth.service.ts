import { hashCrypto } from "../lib/bycript"
import { prisma } from "../lib/prisma"

export const addRefreshtokenToWishlist = (
    {refreshToken, userId} 
    : {refreshToken : string, userId : string}
) =>{
    prisma.refreshToken.create({
        data : {
            hashedToken : hashCrypto(refreshToken),
            userId,
            expireAt : new Date(Date.now() + 1000 * 60 * 60 * 24  )
        }
    })
} 