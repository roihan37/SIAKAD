import express, { Request, Response } from "express";
import { Controller } from "../controllers/userController";

const router = express.Router()
router.post("/", Controller.addUser);
router.get("/:id", Controller.getUserById);
router.put("/:id", Controller.updateUserById);
router.delete(':id', Controller.deleteUserById)

export default router
