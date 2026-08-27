import express from "express";
import { Controller } from "../controllers/kurikulumController";

const router = express.Router();

router.post("/", Controller.createKurikulum);
// router.put("/:id", Controller.updateKurikulum);
router.get("/", Controller.getAllKurikulum);
// router.get("/:id", Controller.getKurikulumById);
// router.delete("/:id", Controller.deleteKurikulumById);

export default router;
