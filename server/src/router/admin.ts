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
export default router;
