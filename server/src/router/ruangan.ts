import { adminMiddleware } from "../middleware/authMid";
import express from "express";
import { Controller } from "../controllers/ruanganController";

const router = express.Router();

router.post("/", Controller.createRuangan);
router.put("/:id", adminMiddleware, Controller.updateRuangan);
router.patch("/:id", adminMiddleware, Controller.updateRuangan);
router.get("/", Controller.getAllRuangan);
router.get("/:id", Controller.getRuanganById);
router.delete("/:id", adminMiddleware, Controller.deleteRuanganById);

export default router;
