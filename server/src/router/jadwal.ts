import express from "express";
import { Controller } from "../controllers/jadwalController";

const router = express.Router();

router.post("/", Controller.createJadwal);
router.put("/:id", Controller.updateJadwal);
router.get("/", Controller.getAllJadwal);
router.get("/:id", Controller.getJadwalById);
router.delete("/:id", Controller.deleteJadwalById);

export default router;
