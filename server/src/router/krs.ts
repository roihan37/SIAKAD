import express from "express";
import { Controller } from "../controllers/krsController";

const router = express.Router();

router.post("/", Controller.createKRS);
router.put("/:id", Controller.updateKRS);
router.get("/", Controller.getAllKRS);
router.get("/:id", Controller.getKRSById);
router.delete("/:id", Controller.deleteKRSById);

export default router;
