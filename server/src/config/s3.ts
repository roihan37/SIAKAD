import { S3Client } from "@aws-sdk/client-s3";
import { getStorageEnv } from "./env";

// The SDK resolves environment, profile, web-identity, or workload-role credentials.
export const s3 = new S3Client({ region: getStorageEnv().AWS_REGION });
