import express from "express";
import { Controller } from "../controllers/lecturerController";

const router = express.Router()

// CRUD dosen
router.route("/")
    .get(Controller.getAllLecturers)
    .post(Controller.createLecturer);

router.route("/:id")
    .get(Controller.getLecturerById)
    .patch(Controller.updateLecturerById)
    .delete(Controller.deleteLecturerById);

export default router
