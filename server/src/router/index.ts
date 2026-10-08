import express, { Request, Response } from "express";
import { authMiddleware } from "../middleware/authMid";
import routerUser from "./users";
import routerProdi from "./prodi";
import routerAunth from "./auth";
import routerStudents from "./students";
import routerLecturers from "./lecturers";
import routerFakultas from "./fakultas";
import routerAvatars from "./avatars";
import routerRuangan from "./ruangan";
import routerTahunAkademik from "./tahun-akademik";
import routerKelas from "./kelas";
import routerKurikulum from "./kurikulum";
import routerKelasMataKuliah from "./kelas-mata-kuliah";
import routerMataKuliah from "./mata-kuliah";
import routerJadwal from "./jadwal";
import routerAdmin from "./admin";
import routerKRS, { studentKRSRouter } from "./krs";
import routerHealth from "./health";
import { notFoundHandler } from "../middleware/notFound";

const router = express.Router()

// Health endpoints (public, no auth required)
router.use('/health', routerHealth)

// Auth routes (public)
router.use('/api/v1/auth',routerAunth)

// Authenticate every existing protected namespace; unknown namespaces reach the 404.
router.use('/api/v1/admin', authMiddleware, routerAdmin)
router.use('/api/v1/users', authMiddleware, routerUser)
router.use('/api/v1/students', authMiddleware, routerStudents)
router.use('/api/v1/lecturers', authMiddleware, routerLecturers)
router.use('/api/v1/fakultas', authMiddleware, routerFakultas)
router.use('/api/v1/prodi', authMiddleware, routerProdi)
router.use('/api/v1/avatars', authMiddleware, routerAvatars)
router.use('/api/v1/ruangan', authMiddleware, routerRuangan)
router.use('/api/v1/tahun-akademik', authMiddleware, routerTahunAkademik)
router.use('/api/v1/kelas', authMiddleware, routerKelas)
router.use('/api/v1/kurikulum', authMiddleware, routerKurikulum)
router.use('/api/v1/mata-kuliah', authMiddleware, routerMataKuliah)
router.use('/api/v1/kelas-mata-kuliah', authMiddleware, routerKelasMataKuliah)
router.use('/api/v1/jadwal', authMiddleware, routerJadwal)
router.use('/api/v1/student/me/krs', authMiddleware, studentKRSRouter)
router.use('/api/v1/krs', authMiddleware, routerKRS)

// Catch-all for unknown API routes (must be after all valid routes)
router.use(notFoundHandler)

export default router
