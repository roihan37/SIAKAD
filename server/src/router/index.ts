import express, { Request, Response } from "express";
import routerUser from "./users";
import routerProdi from "./prodi";
import routerAunth from "./auth";
import routerStudents from "./users";
import routerLecturers from "./users";
import routerFakultas from "./fakultas";
import { authMiddleware } from "../middleware/authMid";

const router = express.Router()


router.use('/api/v1/auth',routerAunth)
router.use(authMiddleware)
router.use('/api/v1/users',routerUser)
router.use('/api/v1/students',routerStudents)
router.use('/api/v1/lecturers',routerLecturers)
router.use('/api/v1/fakutas',routerFakultas)
router.use('/api/v1/prodi',routerProdi)

export default router
