import { adminMiddleware } from "../middleware/authMid";
import express from "express";
import { Controller } from "../controllers/krsController";

const router = express.Router();

router.post("/", Controller.createKRS);
router.put("/:id", adminMiddleware, Controller.updateKRS);
router.patch("/:id", adminMiddleware, Controller.updateKRS);
router.get("/", Controller.getAllKRS);
router.get("/:id", Controller.getKRSById);
router.delete("/:id", adminMiddleware, Controller.deleteKRSById);

export default router;
