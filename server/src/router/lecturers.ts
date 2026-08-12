import express from "express";
import { Controller } from "../controllers/lecturerController";

const router = express.Router()

// Avatar create harus didaftarkan sebelum route `/:id`.
router.post("/avatar/upload-url", Controller.createAvatarUpload);
router.post("/:id/avatar/upload-url", Controller.createAvatarUploadForEdit);

// CRUD dosen
router.route("/")
    .get(Controller.getAllLecturers)
    .post(Controller.createLecturer);

router.route("/:id")
    .get(Controller.getLecturerById)
    .patch(Controller.updateLecturerById)
    .delete(Controller.deleteLecturerById);

export default router
