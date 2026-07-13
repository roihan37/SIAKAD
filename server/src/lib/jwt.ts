import jwt from 'jsonwebtoken';

export const decoded = (token : string) => {
    return jwt.verify(token, 'shhhhh');
 } 
 