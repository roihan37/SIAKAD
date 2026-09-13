import { adminMiddleware } from "../middleware/authMid";
import express, { Request, Response } from "express";
import { Controller } from "../controllers/prodiController";

const router = express.Router()
router.post("/", Controller.createProdi);
router.put("/:id", adminMiddleware, Controller.updateProdi);
router.patch("/:id", adminMiddleware, Controller.updateProdi);
router.get("/", Controller.getAllProdi);
router.get("/:id", Controller.getProdiById);
router.delete("/:id", adminMiddleware, Controller.deleteProdiById);


export default router
