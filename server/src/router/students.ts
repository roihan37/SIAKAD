import express from "express";
import { Controller } from "../controllers/studentController";

const router = express.Router()

// STUDENTS — CRUD utama
router.get("/", Controller.getAllStudents);
router.post("/", Controller.createStudent);
router.get("/:id", Controller.getStudentById);
router.get("/:id/history-semester", Controller.getStudentSemesterHistory);
router.get("/:id/krs", Controller.getStudentKRS);
router.get("/:id/nilai", Controller.getStudentNilai);
router.patch("/:id", Controller.updateStudentById);
router.delete("/:id", Controller.deleteUserById);

export default router
