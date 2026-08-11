import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "../config/s3";




const bucket = process.env.AWS_BUCKET_NAME!;

export class S3Service {

    static async checkObjectExists(key: string){
        try {

            const command = 
            new HeadObjectCommand({
                Bucket : bucket,
                Key : key
            })

            await s3.send(command)
            return true
            
        } catch {
            return false; // 404/NotFound dari S3 akan masuk sini
        }
    }

    static async createUploadUrl(
        key : string,
        contenType : string
    ){
        const command =
        new PutObjectCommand({
            Bucket : bucket,
            Key : key,
            ContentType : contenType
        })

        return await getSignedUrl(
            s3,
            command,
            {
                expiresIn : 300
            }
        )
    }

    static async createReadUrl(
        key : string
    ){
        const command =
        new GetObjectCommand({
            Bucket : bucket,
            Key : key
        })

        return await getSignedUrl(
            s3,
            command,
            {
                expiresIn : 300
            }
        )
    }

    static async deleteUrl(
        key : string
    ){
        await s3.send(
            new DeleteObjectCommand({
                Bucket: bucket,
                Key: key,
            })

        );
    }
}