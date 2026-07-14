import { Prisma } from "@prisma/client";
import { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (
    error,
    req,
    res,
    next
) => {
    
    if (error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
    ) {
        const field = error.meta?.target as string[];
        return res.status(409).json({
            message: `${field.join(", ")} sudah terdaftar`
        });
    } else if (error.name === "badRequest") {
        return res.status(400).json({
            message: "Email / Password is required"
        });
    }
    else if (error.name === "Unauthorized") {
        return res.status(401).json({
            message: "Invalid Email / Password"
        });
    }
    else if (error.name === "badRequest") {
        return res.status(400).json({
            message: "Email / Password is required"
        });
    } 
    return res.status(500).json({
        message: "Internal Server Error"
    });
    

};