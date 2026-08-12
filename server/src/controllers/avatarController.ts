import { NextFunction, Request, Response } from "express";
import { AvatarEntity, AvatarService } from "../services/avatar.service";

export class AvatarController {
    static async createUploadUrl(entity: AvatarEntity, req: Request, res: Response, next: NextFunction) {
        try {
            const { contentType } = req.body;
            const result = await AvatarService.createUploadUrl(entity, contentType);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    static async createUploadUrlForEdit(entity: AvatarEntity, req: Request, res: Response, next: NextFunction) {
        try {
            const userId = String(req.params.id);
            const { contentType } = req.body;
            const result = await AvatarService.createUploadUrlForEdit(entity, userId, contentType);
            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
}
