import { randomUUID } from "crypto";
import { S3Service } from "./s3.service";

export class StudentService{
    static async createAvatarUpload(
        stundentId : string,
        mime : string
    ){
        const extension = mime.split("/")[1];

        const key = `students/${stundentId}/avatar-${randomUUID()}.${extension}`

        const uploadUrl = await S3Service.createUploadUrl(key, mime)

    }
}