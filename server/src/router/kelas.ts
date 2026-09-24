import { adminMiddleware } from "../middleware/authMid";
import express from "express";
import { Controller } from "../controllers/kelasController";

const router = express.Router();

router.post("/", adminMiddleware, Controller.createKelas);
router.put("/:id", adminMiddleware, Controller.updateKelas);
router.get("/", Controller.getAllKelas);
router.get("/:id", Controller.getKelasById);
router.delete("/:id", adminMiddleware, Controller.deleteKelasById);

export default router;
