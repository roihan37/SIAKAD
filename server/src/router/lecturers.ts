import express, { Request, Response } from "express";
import { Controller } from "../controllers/userController";

const router = express.Router()

// lecturers
router.get("/lecturers", Controller.getAllLecturers);
router.get("/lecturers/:id", Controller.getAllLecturerById);

export default router
