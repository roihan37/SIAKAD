import express, { Request, Response } from "express";
import { Controller } from "../controllers/userController";

const router = express.Router()
// students
router.get("/students", Controller.getAllStudents);
router.get("/students/:id", Controller.getStudentById);

export default router
