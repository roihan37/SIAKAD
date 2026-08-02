import express, { Request, Response } from "express";
import { Controller } from "../controllers/userController";

const router = express.Router()
router.post("/", Controller.addUser);
router.get("/:id", Controller.getUserById);
router.put("/:id", Controller.updateUserById);

// students
router.get("/students", Controller.getAllStudents);
router.get("/students/:id", Controller.getStudentById);

// lecturers
router.get("/lecturers", Controller.getAllLecturers);
router.get("/lecturers/:id", Controller.getAllLecturerById);

export default router
