import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("file:./prisma/dev.db"),
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

export const env = envSchema.parse(process.env);
