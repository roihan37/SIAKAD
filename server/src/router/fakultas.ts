import { adminMiddleware } from "../middleware/authMid";
import express, { Request, Response } from "express";
import { Controller } from "../controllers/fakultasController";

const router = express.Router()
router.post("/", adminMiddleware, Controller.createFakultas);
router.put("/:id", adminMiddleware, Controller.updateFakultas);
router.get("/", Controller.getAllFakultas);
router.get("/:id", Controller.getFakultasById);
router.delete("/:id", adminMiddleware, Controller.deleteFakultasById);


export default router
