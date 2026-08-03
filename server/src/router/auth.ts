import express, { Request, Response } from "express";
import { Controller } from "../controllers/authController";
import { authMiddleware } from "../middleware/authMid";

const router = express.Router()

router.post('/login', Controller.login)
router.post('/refreshTokens', Controller.refreshToken)
router.use(authMiddleware)
router.post('/logout', Controller.revokeRefreshTokens)


export default router