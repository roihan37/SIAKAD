import { adminMiddleware } from "../middleware/authMid";
import express from "express";
import { Controller } from "../controllers/kelasMataKuliahController";

const router = express.Router();

router.post("/", adminMiddleware, Controller.createKelasMK);
router.put("/:id", adminMiddleware, Controller.updateKelasMK);
router.get("/", Controller.getAllKelasMK);
router.get("/:id", Controller.getKelasMKById);
router.delete("/:id", adminMiddleware, Controller.deleteKelasMKById);

export default router;
