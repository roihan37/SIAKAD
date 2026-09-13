import { adminMiddleware } from "../middleware/authMid";
import express from "express";
import { Controller } from "../controllers/kurikulumController";

const router = express.Router();

router.post("/", Controller.createKurikulum);
router.put("/:id", adminMiddleware, Controller.updateKurikulum);
router.patch("/:id", adminMiddleware, Controller.updateKurikulum);
router.get("/", Controller.getAllKurikulum);
router.get("/:id", Controller.getKurikulumById);
router.delete("/:id", adminMiddleware, Controller.deleteKurikulumById);

export default router;
