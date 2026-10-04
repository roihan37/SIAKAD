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
import routerKRS from "./krs";
import routerHealth from "./health";
import { notFoundHandler } from "../middleware/notFound";

const router = express.Router()

// Health endpoints (public, no auth required)
router.use('/health', routerHealth)

// Auth routes (public)
router.use('/api/v1/auth',routerAunth)

// Apply authentication middleware to all remaining routes
router.use(authMiddleware)

// Domain routers
router.use('/api/v1/admin',routerAdmin)
router.use('/api/v1/users',routerUser)
router.use('/api/v1/students',routerStudents)
router.use('/api/v1/lecturers',routerLecturers)
router.use('/api/v1/fakultas',routerFakultas)
router.use('/api/v1/prodi',routerProdi)
router.use('/api/v1/avatars',routerAvatars)
router.use('/api/v1/ruangan', routerRuangan)
router.use('/api/v1/tahun-akademik', routerTahunAkademik)
router.use('/api/v1/kelas', routerKelas)
router.use('/api/v1/kurikulum', routerKurikulum)
router.use('/api/v1/mata-kuliah', routerMataKuliah)
router.use('/api/v1/kelas-mata-kuliah', routerKelasMataKuliah)
router.use('/api/v1/jadwal', routerJadwal)
router.use('/api/v1/krs', routerKRS)

// Catch-all for unknown API routes (must be after all valid routes)
router.use(notFoundHandler)

export default router
