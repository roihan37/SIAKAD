import jwt from "jsonwebtoken";
import crypto from 'crypto';

export const generateAccessToken = (payload : object) => {
    return jwt.sign(payload, 'shhhhh', {
       expiresIn: '5m'
    });
 } 

export const generateRefreshToken = (payload : object) =>{
    const token = crypto.randomBytes(16).toString('base64url');
   return token;
}

export const generateTokens = (payload : object) => {
   const accessToken = generateAccessToken(payload)
   const refreshToken = generateRefreshToken(payload)
   return {accessToken, refreshToken}
}