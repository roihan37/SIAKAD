import express from "express";
import { Controller } from "../controllers/kelasController";

const router = express.Router();

router.post("/", Controller.createKelas);
router.put("/:id", Controller.updateKelas);
router.get("/", Controller.getAllKelas);
router.get("/:id", Controller.getKelasById);
router.delete("/:id", Controller.deleteKelasById);

export default router;
