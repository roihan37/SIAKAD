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
import routerKRS from "./krs";

const router = express.Router()


router.use('/api/v1/auth',routerAunth)
router.use(authMiddleware)
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

export default router
