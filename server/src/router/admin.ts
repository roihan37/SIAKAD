import express from "express";
import { Controller } from "../controllers/adminController";
import { adminMiddleware } from "../middleware/authMid";

const router = express.Router();
router.get("/dashboard", adminMiddleware, Controller.getDashboard);
export default router;
