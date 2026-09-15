import { Controller as AttendanceController } from "../controllers/attendanceController";
import express from "express";
import { Controller } from "../controllers/adminController";
import { adminMiddleware } from "../middleware/authMid";

const router = express.Router();
router.get("/dashboard", adminMiddleware, Controller.getDashboard);
router.get("/presensi/summary", adminMiddleware, AttendanceController.summary);
router.get("/presensi/students", adminMiddleware, AttendanceController.students);
router.get("/presensi/meetings", adminMiddleware, AttendanceController.meetings);
router.get("/presensi/meetings/:meetingId", adminMiddleware, AttendanceController.meetingDetail);
router.get("/presensi/filters", adminMiddleware, AttendanceController.filters);

router.post("/ukt/bills/generate", adminMiddleware, Controller.generateBillsUKT);
router.get("/ukt/bills", adminMiddleware, Controller.getUKTBills);

router.get("/grades/summary", adminMiddleware, Controller.getGradeSummary);
router.get("/grades/students", adminMiddleware, Controller.getStudentGradeRecap);
router.get("/grades/courses", adminMiddleware, Controller.getCourseGradeRecap);
router.get("/grades/courses/:kelasMataKuliahId/students", adminMiddleware, Controller.getCourseGradeDetail);
router.get("/grades/students/:studentId/courses/:kelasMataKuliahId", adminMiddleware, Controller.getStudentGradeDetail);

router.get("/payments", adminMiddleware, Controller.getPayments);
router.get("/payments/:paymentId", adminMiddleware, Controller.getPaymentById);
router.patch("/payments/:paymentId/verify", adminMiddleware, Controller.verifyPayment);
router.patch("/payments/:paymentId/cancel", adminMiddleware, Controller.cancelPayment);
export default router;
