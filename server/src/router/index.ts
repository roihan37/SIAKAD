import express, { Request, Response } from "express";
import routerUser from "./users";

const router = express.Router()


router.use('/users',routerUser)

export default router
