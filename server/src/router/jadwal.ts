import { adminMiddleware } from "../middleware/authMid";
import express from "express";
import { Controller } from "../controllers/jadwalController";

const router = express.Router();

router.post("/", Controller.createJadwal);
router.put("/:id", adminMiddleware, Controller.updateJadwal);
router.patch("/:id", adminMiddleware, Controller.updateJadwal);
router.get("/", Controller.getAllJadwal);
router.get("/:id", Controller.getJadwalById);
router.delete("/:id", adminMiddleware, Controller.deleteJadwalById);

export default router;
