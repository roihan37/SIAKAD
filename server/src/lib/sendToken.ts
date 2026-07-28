import crypto from 'crypto';
import { createTokenJwt } from "./jwt";

export const generateAccessToken = (payload : object) => {
    return createTokenJwt(payload)
 } 

export const generateRefreshToken = () =>{
    const token = crypto.randomBytes(16).toString('base64url');
   return token;
}

export const generateTokens = (payload : object) => {
   const accessToken = generateAccessToken(payload)
   const refreshToken = generateRefreshToken()
   return {accessToken, refreshToken}
}