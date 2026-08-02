import express, { Request, Response } from "express";
import routerUser from "./users";
import routerAunth from "./auth";
import routerFakultas from "./fakultas";
import { authMiddleware } from "../middleware/authMid";

const router = express.Router()


router.use('/auth',routerAunth)
router.use(authMiddleware)
router.use('/users',routerUser)
router.use('/fakutas',routerFakultas)

export default router
