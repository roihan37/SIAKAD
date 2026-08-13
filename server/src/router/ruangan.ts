import express from "express";
import { Controller } from "../controllers/ruanganController";

const router = express.Router();

router.post("/", Controller.createRuangan);
router.put("/:id", Controller.updateRuangan);
router.get("/", Controller.getAllRuangan);
router.get("/:id", Controller.getRuanganById);
router.delete("/:id", Controller.deleteRuanganById);

export default router;
