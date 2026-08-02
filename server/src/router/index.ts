import express, { Request, Response } from "express";
import routerUser from "./users";
import routerAunth from "./auth";
import routerFakultas from "./fakultas";
import routerProdi from "./prodi";
import { authMiddleware } from "../middleware/authMid";

const router = express.Router()


router.use('/auth',routerAunth)
router.use(authMiddleware)
router.use('/users',routerUser)
router.use('/fakutas',routerFakultas)
router.use('/prodi',routerProdi)

export default router
