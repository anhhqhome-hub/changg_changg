import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("file:./prisma/dev.db"),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).default("dev-secret-change-me-32-characters"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  UPLOAD_DIR: z.string().default("./storage/uploads"),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(25),
  APP_TIMEZONE: z.string().default("Asia/Ho_Chi_Minh"),
  DEFAULT_LOCALE: z.enum(["vi", "en"]).default("vi"),
  GROQ_API_KEY: z.string().optional(),
  GROQ_BASE_URL: z.string().url().default("https://api.groq.com/openai/v1"),
  GROQ_AI_MODEL: z.string().default("openai/gpt-oss-120b")
});

const parsed = envSchema.parse(process.env);
const isVercel = process.env.VERCEL === "1";

function vercelBaseUrl() {
  const host =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
      : process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;

  return host ? `https://${host}` : undefined;
}

const configuredAuthUrl = process.env.BETTER_AUTH_URL?.trim();
const shouldUseVercelAuthUrl =
  isVercel && (!configuredAuthUrl || configuredAuthUrl.includes("localhost") || configuredAuthUrl.includes("127.0.0.1"));

const configuredUploadDir = process.env.UPLOAD_DIR?.trim();
const shouldUseVercelUploadDir =
  isVercel && (!configuredUploadDir || configuredUploadDir === "./storage/uploads" || configuredUploadDir === "storage/uploads");

const remoteDatabaseUrl = process.env.TURSO_DATABASE_URL?.trim();
const remoteDatabaseToken = process.env.TURSO_AUTH_TOKEN?.trim();

export const env = {
  ...parsed,
  DATABASE_URL: remoteDatabaseUrl || parsed.DATABASE_URL,
  DATABASE_AUTH_TOKEN: remoteDatabaseToken || parsed.DATABASE_AUTH_TOKEN,
  BETTER_AUTH_URL: shouldUseVercelAuthUrl ? vercelBaseUrl() ?? parsed.BETTER_AUTH_URL : parsed.BETTER_AUTH_URL,
  UPLOAD_DIR: shouldUseVercelUploadDir ? "/tmp/changg-changg/uploads" : parsed.UPLOAD_DIR
};
