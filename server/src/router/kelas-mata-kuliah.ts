import express from "express";
import { Controller } from "../controllers/kelasMataKuliahController";

const router = express.Router();

router.post("/", Controller.createKelasMK);
router.put("/:id", Controller.updateKelasMK);
router.get("/", Controller.getAllKelasMK);
router.get("/:id", Controller.getKelasMKById);
router.delete("/:id", Controller.deleteKelasMKById);

export default router;
