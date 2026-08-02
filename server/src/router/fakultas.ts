import express, { Request, Response } from "express";
import { Controller } from "../controllers/fakultasController";

const router = express.Router()
router.post("/", Controller.createFakultas);
router.put("/:id", Controller.updateFakultas);
router.get("/", Controller.getAllFakultas);
router.get("/:id", Controller.getFakultasById);
router.delete("/:id", Controller.deleteFakultasById);


export default router
