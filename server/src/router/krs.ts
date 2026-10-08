import { adminMiddleware, mahasiswaMiddleware } from "../middleware/authMid";
import express from "express";
import { Controller } from "../controllers/krsController";

const router = express.Router();
router.use(adminMiddleware);

export const studentKRSRouter = express.Router();
studentKRSRouter.use(mahasiswaMiddleware);
studentKRSRouter.get("/", Controller.getMyKRS);
studentKRSRouter.put("/draft", Controller.saveMyKRSDraft);
studentKRSRouter.post("/submit", Controller.submitMyKRS);

router.post("/", Controller.createKRS);
router.put("/:id", adminMiddleware, Controller.updateKRS);
router.patch("/:id", adminMiddleware, Controller.updateKRS);
router.get("/", Controller.getAllKRS);
router.get("/:id", Controller.getKRSById);
router.delete("/:id", adminMiddleware, Controller.deleteKRSById);

export default router;
