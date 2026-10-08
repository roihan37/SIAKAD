import express from "express";
import { Controller } from "../controllers/studentController";
import { adminMiddleware, adminOrMahasiswaMiddleware, mahasiswaMiddleware } from "../middleware/authMid";

export const studentProfileRouter = express.Router();
studentProfileRouter.use(mahasiswaMiddleware);
studentProfileRouter.get("/profile", Controller.getMyProfile);
studentProfileRouter.patch("/profile", Controller.updateMyProfile);
studentProfileRouter.patch("/avatar", Controller.updateMyAvatar);
studentProfileRouter.patch("/change-password", Controller.changeMyPassword);

const router = express.Router()

// STUDENTS — CRUD utama
router.get("/",adminMiddleware,Controller.getAllStudents);
router.post("/",adminMiddleware,Controller.createStudent);
router.patch("/:id",adminMiddleware,Controller.updateStudentById);
router.get("/:id",adminOrMahasiswaMiddleware,Controller.getStudentById);
router.get("/:id/history-semester",adminOrMahasiswaMiddleware,Controller.getStudentSemesterHistory);
router.get("/:id/krs",adminOrMahasiswaMiddleware,Controller.getStudentKRS);
router.get("/:id/nilai",adminOrMahasiswaMiddleware,Controller.getStudentNilai);
router.get("/:id/presensi",adminMiddleware,Controller.getStudentAttendance);
router.patch("/:userId/reset-password",adminMiddleware, Controller.resetPassword);
router.patch("/bulk/status",adminMiddleware,Controller.bulkUpdateStatus);
router.delete("/bulk",adminMiddleware,Controller.bulkDelete);
router.delete("/:id",adminMiddleware,Controller.deleteUserById);

router.get("/me/ukt",Controller.getMyUKT);
router.get("/:id/ukt",adminMiddleware,Controller.getUKTById);
router.get("/:id/keuangan",adminMiddleware,Controller.getFinanceyId);


export default router
