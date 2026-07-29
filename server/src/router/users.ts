import express, { Request, Response } from "express";
import { Controller } from "../controllers/userController";

const router = express.Router()
router.post("/", Controller.addUser);

// students
router.get("/students", Controller.getAllStudents);
router.get("/students/:id", Controller.getStudentById);

// lecturers
router.get("/lecturers", Controller.getAllLecturers);

export default router
