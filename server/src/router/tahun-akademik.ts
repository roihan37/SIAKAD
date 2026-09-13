import { adminMiddleware } from "../middleware/authMid";
import express from "express";
import { Controller } from "../controllers/tahunAkademikController";

const router = express.Router();

router.post("/", Controller.createTahunAkademik);
router.put("/:id", adminMiddleware, Controller.updateTahunAkademik);
router.patch("/:id", adminMiddleware, Controller.updateTahunAkademik);
router.get("/", Controller.getAllTahunAkademik);
router.get("/:id", Controller.getTahunAkademikById);
router.delete("/:id", adminMiddleware, Controller.deleteTahunAkademikById);

export default router;
