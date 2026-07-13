import express, { Request, Response } from "express";
import { Controller } from "../controllers/aunthController";

const router = express.Router()

router.post('/login', Controller.login)


export default router