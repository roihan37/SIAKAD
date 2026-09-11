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


router.route("/:id/teach")
    .get(Controller.getLecturerTeach)

router.route("/:id/schedule")
    .get(Controller.getLecturerSchedule)

router.route("/:id/advisees")
    .get(Controller.getAdvisees)

export default router
