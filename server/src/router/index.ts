import express, { Request, Response } from "express";
import routerUser from "./users";
import routerProdi from "./prodi";
import routerAunth from "./auth";
import routerStudents from "./students";
import routerLecturers from "./lecturers";
import routerFakultas from "./fakultas";
import routerAvatars from "./avatars";
import { authMiddleware } from "../middleware/authMid";

const router = express.Router()


router.use('/api/v1/auth',routerAunth)
router.use(authMiddleware)
router.use('/api/v1/users',routerUser)
router.use('/api/v1/students',routerStudents)
router.use('/api/v1/lecturers',routerLecturers)
router.use('/api/v1/fakultas',routerFakultas)
router.use('/api/v1/prodi',routerProdi)
router.use('/api/v1/avatars',routerAvatars)

export default router
