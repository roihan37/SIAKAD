import { NextFunction, Request, Response } from "express";
import { resourceId, text } from "../validation/master-data";
import { StudentFinanceService } from "../services/student-services/student-finance.service";
import { StudentAccountService } from "../services/student-services/student-account.service";
import { StudentManagementService, type UpdateStudentInput } from "../services/student-services/student-management.service";
import { StudentAttendanceService } from "../services/student-services/student-attendance.service";
import { StudentAcademicService } from "../services/student-services/student-academic.service";
import { StudentProfileService } from "../services/student-services/student-profile.service";
import { studentAvatarPatch, studentProfilePatch } from "../validation/student-profile";
import { credentials, newPassword } from "../auth/validation";
import { changeUserPassword } from "../auth/auth.service";
import { clearSessionCookie } from "../auth/session-cookie";
import { sendData } from "../lib/responseHelpers";


export class Controller {

    static async getMyProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const data = await StudentProfileService.getProfile(req.userLogin.id);
            return sendData(res, data);
        } catch (error) { next(error); }
    }

    static async updateMyProfile(req: Request, res: Response, next: NextFunction) {
        try {
            const input = studentProfilePatch(req.body);
            const data = await StudentProfileService.updateProfile(req.userLogin.id, input);
            return sendData(res, data);
        } catch (error) { next(error); }
    }

    static async updateMyAvatar(req: Request, res: Response, next: NextFunction) {
        try {
            const { avatarKey } = studentAvatarPatch(req.body);
            const updated = await StudentManagementService.updateStudent({ userId: req.userLogin.id, avatarKey });
            return sendData(res, { avatarUrl: updated.avatarUrl });
        } catch (error) { next(error); }
    }

    static async changeMyPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.userLogin.id;
            const { password: currentPassword } = credentials({ identifier: userId, password: req.body?.currentPassword });
            const password = newPassword(req.body?.newPassword);
            await changeUserPassword(userId, currentPassword, password);
            clearSessionCookie(res);
            return sendData(res, { message: "Password changed. Please sign in again." });
        } catch (error) { next(error); }
    }

    static async getFinanceyId(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = text("ID user mahasiswa", 100)(req.params.id);
            const tahunAkademikId = req.query.tahunAkademikId === undefined ? undefined : resourceId(req.query.tahunAkademikId);
            const data = await StudentFinanceService.getFinance(userId, tahunAkademikId);
            return res.status(200).json({ message: "Student financial data retrieved successfully", data });
        } catch (error) {
            next(error);
        }
    }

    static async getUKTById(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = text("ID user mahasiswa", 100)(req.params.id);
            const data = await StudentFinanceService.getUKTBills(userId);
            return res.status(200).json({ message: "Tuition bills retrieved successfully", data });
        } catch (error) {
            next(error);
        }
    }

    static async getMyUKT(req: Request, res: Response, next: NextFunction) {
        try {
            if (!req.userLogin) throw { name: "TokenInvalid" };
            if (req.userLogin.role !== "Mahasiswa") throw { name: "Forbidden", message: "Akses hanya untuk mahasiswa." };
            const userId = req.userLogin.id;
            const data = await StudentFinanceService.getMyUKT(userId);
            return res.status(200).json({ message: "Tuition bills retrieved successfully", data });
        } catch (error) {
            next(error);
        }
    }

    static async getStudentAttendance(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = text("ID user mahasiswa", 100)(req.params.id);
            const tahunAkademikId = resourceId(req.query.tahunAkademikId);
            const data = await StudentAttendanceService.getStudentAttendance(userId, tahunAkademikId);
            return res.status(200).json({ message: "Student attendance retrieved successfully", data });
        } catch (error) { next(error); }
    }

    static async bulkUpdateStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { ids, status, statusReason } = req.body;
            const data = await StudentManagementService.bulkUpdateStatus(ids, status, statusReason);
            return res.status(200).json({ message: `${data.changedCount} mahasiswa berhasil diperbarui`, data });
        } catch (error) { next(error); }
    }

    static async createStudent(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        let created = false;
        try {
            const result = await StudentManagementService.createStudent(req.body);
            created = true;
            res.status(201).json({
                message: `${result.name} created successfully`
            });
        } catch (error) {
            // Preserve legacy cleanup even if sending the response fails after commit.
            if (created) await StudentManagementService.cleanupCreateAvatar(req.body.avatarKey);
            next(error);
        }
    }

    static async updateStudentById(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = String(req.params.id);
            const {
                name, email, username, password, phoneNumber, gender, address, nik, birthPlace,
                nim, angkatan, semester, status, statusReason, prodiId, birthDate, avatarKey, dosenId,
            }: Omit<UpdateStudentInput, "userId"> = req.body;
            const input: UpdateStudentInput = {
                userId, name, email, username, password, phoneNumber, gender, address, nik, birthPlace,
                nim, angkatan, semester, status, statusReason, prodiId, birthDate, avatarKey, dosenId,
            };
            const data = await StudentManagementService.updateStudent(input);
            return res.status(200).json({ message: "Mahasiswa berhasil diperbarui", data });
        } catch (error) { next(error); }
    }

    static async deleteUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (typeof id !== "string" || !id.trim()) {
                return res.status(400).json({
                    code: "VALIDATION_ERROR",
                    message: "ID user mahasiswa wajib diisi",
                });
            }

            const student = await StudentManagementService.deleteUserById(id);

            return res.status(200).json({
                message: `${student.name} berhasil dihapus`,
            });
        } catch (error) {
            next(error);
        }
    }

    static async bulkDelete(req: Request, res: Response, next: NextFunction) {
        try {
            const ids: unknown = req.body?.ids;
            if (
                !Array.isArray(ids) || ids.length === 0 || ids.length > 100 ||
                !ids.every((id): id is string => typeof id === "string" && id.trim().length > 0)
            ) {
                return res.status(400).json({
                    code: "VALIDATION_ERROR",
                    message: "ids wajib berupa array berisi 1 sampai 100 ID user mahasiswa yang valid",
                });
            }

            const userIds = [...new Set(ids.map((id) => id.trim()))];
            const students = await StudentManagementService.bulkDelete(userIds);

            return res.status(200).json({
                message: `${students.length} mahasiswa berhasil dihapus`,
                data: { deletedCount: students.length, ids: userIds },
            });
        } catch (error) {
            next(error);
        }
    }

    // STUDENTS
    static async getAllStudents(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const search = String(req.query.search ?? "");
            const sortBy = String(req.query.sortBy ?? "name");
            const sortOrder = req.query.sortOrder === "desc" ? "desc" : "asc";
            const data = await StudentManagementService.getAllStudents(page, limit, search, sortBy, sortOrder);
            return res.status(200).json(data);
        } catch (error) { next(error); }
    }

    static async getStudentById(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const { id } = req.params;
            const data = await StudentManagementService.getStudentById(id as string);
            return res.status(200).json({ student: data });
        } catch (error) {
            next(error);
        }
    }
    static async getStudentSemesterHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = String(req.params.id);
            const result = await StudentAcademicService.getStudentSemesterHistory(userId);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
    static async getStudentKRS(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = String(req.params.id);
            const tahunAkademikIdParam = req.query.tahunAkademikId;

            if (tahunAkademikIdParam === undefined) {
                throw { name: "BadRequest", message: "tahunAkademikId wajib diisi" };
            }

            const tahunAkademikId = Number(tahunAkademikIdParam);
            if (!Number.isInteger(tahunAkademikId) || tahunAkademikId <= 0) {
                throw { name: "BadRequest", message: "tahunAkademikId harus berupa angka positif" };
            }

            const result = await StudentAcademicService.getStudentKRS(userId, tahunAkademikId);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
    static async getStudentNilai(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = text("ID user mahasiswa", 100)(req.params.id);
            const tahunAkademikId = req.query.tahunAkademikId === undefined ? undefined : resourceId(req.query.tahunAkademikId);
            if (tahunAkademikId === undefined) {
                throw { name: "BadRequest", message: "tahunAkademikId wajib diisi" };
            }

            const result = await StudentAcademicService.getStudentNilai(userId, tahunAkademikId);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async resetPassword(
        req: Request,
        res: Response,
        next: NextFunction
    ) {
        try {
            const userId = String(req.params.userId);
            const { password } = req.body;

            const result = await StudentAccountService.resetPassword(userId, password);

            return res.status(200).json({
                message: "Password mahasiswa berhasil direset",
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
}
