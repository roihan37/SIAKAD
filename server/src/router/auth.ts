import express, { Request, Response } from "express";
import { Controller } from "../controllers/authController";

const router = express.Router()

router.post('/login', Controller.login)
router.post('/refreshTokens', Controller.refreshToken)


export default router