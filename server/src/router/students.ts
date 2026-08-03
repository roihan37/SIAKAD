import express, { Request, Response } from "express";
import { Controller } from "../controllers/userController";

const router = express.Router()
// students
router.get("/", Controller.getAllStudents);
router.get("/:id", Controller.getStudentById);

export default router
