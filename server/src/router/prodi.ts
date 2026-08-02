import express, { Request, Response } from "express";
import { Controller } from "../controllers/prodiController";

const router = express.Router()
router.post("/", Controller.createProdi);
router.put("/:id", Controller.updateProdi);
router.get("/", Controller.getAllProdi);
router.get("/:id", Controller.getProdiById);
router.delete("/:id", Controller.deleteProdiById);


export default router
