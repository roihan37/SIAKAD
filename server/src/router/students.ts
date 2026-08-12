import express from "express";
import { Controller } from "../controllers/studentController";

const router = express.Router()

// STUDENTS — CRUD utama
router.get("/", Controller.getAllStudents);
router.post("/", Controller.createStudent);
router.get("/:id", Controller.getStudentById);
router.patch("/:id", Controller.updateStudentById);
router.delete("/:id", Controller.deleteUserById);

// AVATAR — upload-url untuk CREATE (belum ada studentId, path statis, didaftarkan sebelum pattern dinamis)
router.post("/avatar/upload-url", Controller.createAvatarUpload);

// AVATAR — upload-url untuk EDIT (studentId sudah ada)
router.post("/:id/avatar/upload-url", Controller.createAvatarUploadForEdit);

// TIDAK ADA route confirm/update avatar terpisah — konfirmasi sudah menyatu
// di dalam createStudent (POST /) dan updateStudentById (PATCH /:id)

export default router