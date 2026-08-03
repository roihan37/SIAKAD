import express, { Request, Response } from "express";
import { Controller } from "../controllers/userController";

const router = express.Router()

// lecturers
router.get("/", Controller.getAllLecturers);
router.get("/:id", Controller.getAllLecturerById);

export default router
