import { hashCrypto } from "../lib/bycript"
import { prisma } from "../lib/prisma"

export const addRefreshtokenToWishlist = (
    {refreshToken, userId} 
    : {refreshToken : string, userId : string}
) =>{
    return prisma.refreshToken.create({
        data : {
            hashedToken : hashCrypto(refreshToken),
            userId,
            expireAt : new Date(Date.now() + 1000 * 60 * 60 * 24  )
        }
    })
} 

export const findRefreshToken = (
    token : string
    )=>{
    return prisma.refreshToken.findUnique({
        where : {
            hashedToken: hashCrypto(token)
        }
    })
}

export const revokeTokensOnReuse = (
    userId : string
    )=>{
    return prisma.refreshToken.updateMany({
        where : {
            userId,
            revoked : false,
            expireAt: {
                gt: new Date(),
            }
        },
        data : {
            revoked : true
        }
    })
}


export const deleteRefreshTokenById = (
    userId : string
    )=>{
    return prisma.refreshToken.updateMany({
        where : {
            userId,
        },
        data : {
            revoked : true
        }
    })
}
