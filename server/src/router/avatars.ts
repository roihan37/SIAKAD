import express from "express";
import { AvatarController } from "../controllers/avatarController";

const router = express.Router();

router.post("/students/upload-url", (req, res, next) =>
    AvatarController.createUploadUrl("students", req, res, next)
);
router.post("/lecturers/upload-url", (req, res, next) =>
    AvatarController.createUploadUrl("lecturers", req, res, next)
);
router.post("/students/:id/upload-url", (req, res, next) =>
    AvatarController.createUploadUrlForEdit("students", req, res, next)
);
router.post("/lecturers/:id/upload-url", (req, res, next) =>
    AvatarController.createUploadUrlForEdit("lecturers", req, res, next)
);

export default router;
