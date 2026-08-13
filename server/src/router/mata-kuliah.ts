import express from "express";
import { Controller } from "../controllers/mataKuliahController";

const router = express.Router();

router.post("/", Controller.createMataKuliah);
router.put("/:id", Controller.updateMataKuliah);
router.get("/", Controller.getAllMataKuliah);
router.get("/:id", Controller.getMataKuliahById);
router.delete("/:id", Controller.deleteMataKuliahById);

export default router;
