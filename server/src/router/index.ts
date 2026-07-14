import express, { Request, Response } from "express";
import routerUser from "./users";
import routerAunth from "./auth";

const router = express.Router()


router.use('/users',routerUser)
router.use('/auth',routerAunth)

export default router
