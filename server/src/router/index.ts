import express, { Request, Response } from "express";
import routerUser from "./users";
import routerAunth from "./auth";
import { authMiddleware } from "../middleware/authMid";

const router = express.Router()


router.use('/auth',routerAunth)
router.use(authMiddleware)
router.use('/users',routerUser)

export default router
