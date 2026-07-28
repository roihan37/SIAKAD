import jwt from 'jsonwebtoken';

export const decoded = (token : string) => {
    return jwt.verify(token, 'shhhhh');
 } 
 
export const createTokenJwt = (payload : object) => {
  return jwt.sign(payload, 'shhhhh', {
      expiresIn: '3s'
   });
}