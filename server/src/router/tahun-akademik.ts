import express from "express";
import { Controller } from "../controllers/tahunAkademikController";

const router = express.Router();

router.post("/", Controller.createTahunAkademik);
router.put("/:id", Controller.updateTahunAkademik);
router.get("/", Controller.getAllTahunAkademik);
router.get("/:id", Controller.getTahunAkademikById);
router.delete("/:id", Controller.deleteTahunAkademikById);

export default router;
