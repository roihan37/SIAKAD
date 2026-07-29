import express, { Request, Response } from "express";
import { Controller } from "../controllers/userController";

const router = express.Router()
router.post("/", Controller.addUser);
router.get("/:id", Controller.getUserById);

// students
router.get("/students", Controller.getAllStudents);

// lecturers
router.get("/lecturers", Controller.getAllLecturers);

export default router
