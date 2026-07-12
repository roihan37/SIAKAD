import express, { Request, Response } from "express";
import { Controller } from "../controllers/userController";

const router = express.Router()
router.get("/students", Controller.getAllStudents);

export default router
