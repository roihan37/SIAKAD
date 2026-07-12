import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export class Controller {
    static async getAllStudents(req: Request, res : Response){
        try {
            const allStudents = await prisma.user.findMany()
            console.log(allStudents);
            
        } catch (error) {
            
        }
    }

}

