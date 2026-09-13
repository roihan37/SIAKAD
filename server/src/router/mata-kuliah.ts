import { adminMiddleware } from "../middleware/authMid";
import express from "express";
import { Controller } from "../controllers/mataKuliahController";

const router = express.Router();

router.post("/", Controller.createMataKuliah);
router.put("/:id", adminMiddleware, Controller.updateMataKuliah);
router.patch("/:id", adminMiddleware, Controller.updateMataKuliah);
router.get("/", Controller.getAllMataKuliah);
router.get("/:id", Controller.getMataKuliahById);
router.delete("/:id", adminMiddleware, Controller.deleteMataKuliahById);

export default router;
