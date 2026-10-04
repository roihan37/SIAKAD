import { config } from "dotenv";

// One loading boundary; deployment values take precedence over the local .env.
config({ quiet: true, debug: false });

type Environment = Readonly<Record<string, string | undefined>>;
export interface ValidatedEnv {
  readonly NODE_ENV: string;
  readonly DATABASE_URL: string;
  readonly JWT_SECRET: string;
  readonly CLIENT_ORIGIN: string;
  readonly AWS_REGION: string;
  readonly AWS_BUCKET_NAME: string;
}

function required(source: Environment, name: string): string {
  const value = source[name];
  if (!value?.trim()) throw new Error(`Environment configuration: ${name} is required.`);
  return value;
}

export function validateDatabaseUrl(source: Environment): string {
  const value = required(source, "DATABASE_URL");
  try {
    const url = new URL(value);
    if (!["postgres:", "postgresql:"].includes(url.protocol) ||
        (!url.hostname && !url.searchParams.get("host"))) throw new Error();
  } catch {
    // Never attach the URL parser error: it can contain credentials.
    throw new Error("Environment configuration: DATABASE_URL must be a PostgreSQL URL.");
  }
  return value;
}

export function validateEnv(source: Environment): Readonly<ValidatedEnv> {
  const DATABASE_URL = validateDatabaseUrl(source);
  const JWT_SECRET = required(source, "JWT_SECRET");
  if (Buffer.byteLength(JWT_SECRET) < 32) {
    throw new Error("Environment configuration: JWT_SECRET must contain at least 32 bytes.");
  }
  const CLIENT_ORIGIN = source.CLIENT_ORIGIN || "http://localhost:5173";
  try {
    const url = new URL(CLIENT_ORIGIN);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
        url.pathname !== "/" || url.search || url.hash) throw new Error();
  } catch {
    throw new Error("Environment configuration: CLIENT_ORIGIN must be an HTTP(S) origin without credentials, path, query, or fragment.");
  }
  const { AWS_REGION, AWS_BUCKET_NAME } = validateStorageEnv(source);
  return Object.freeze({ NODE_ENV: source.NODE_ENV || "development", DATABASE_URL, JWT_SECRET,
    CLIENT_ORIGIN, AWS_REGION, AWS_BUCKET_NAME });
}

function validateStorageEnv(source: Environment) {
  const AWS_REGION = required(source, "AWS_REGION");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)+-\d+$/.test(AWS_REGION)) {
    throw new Error("Environment configuration: AWS_REGION must be an AWS region name.");
  }
  const AWS_BUCKET_NAME = required(source, "AWS_BUCKET_NAME");
  if (AWS_BUCKET_NAME.trim() !== AWS_BUCKET_NAME || /[\s/]/.test(AWS_BUCKET_NAME)) {
    throw new Error("Environment configuration: AWS_BUCKET_NAME must be a bucket name, not a URL or path.");
  }
  return Object.freeze({ AWS_REGION, AWS_BUCKET_NAME });
}

export function getStorageEnv() {
  return validateStorageEnv(process.env);
}

let cached: Readonly<ValidatedEnv> | undefined;
export function getEnv(): Readonly<ValidatedEnv> {
  return cached ??= validateEnv(process.env);
}

// CLI generation and DB-only seed work must not require HTTP/JWT/S3 settings.
export function getDatabaseUrl(): string {
  return validateDatabaseUrl(process.env);
}

export function getSeedEnv() {
  return Object.freeze({
    NODE_ENV: process.env.NODE_ENV || "development",
    SEED_PASSWORD: process.env.SEED_PASSWORD || "Tasik123",
    SEED_TRIAL_PASSWORD: process.env.SEED_TRIAL_PASSWORD || "TrialSIAKAD123!",
  });
}
