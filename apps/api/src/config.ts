import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(__dirname, "..");

dotenv.config({ path: path.join(SERVER_ROOT, ".env") });

function env(name: string, fallback = ""): string {
  return (process.env[name] ?? fallback).trim();
}

export const config = {
  port: Number(env("PORT", "8000")) || 8000,
  llmApiKey: env("LLM_API_KEY"),
  llmBaseUrl: env("LLM_BASE_URL", "https://api.deepseek.com/v1").replace(/\/$/, ""),
  llmModel: env("LLM_MODEL", "deepseek-chat"),
  llmTimeoutMs: Number(env("LLM_TIMEOUT_MS", "120000")) || 120000,
  databasePath: path.isAbsolute(env("DATABASE_PATH"))
    ? env("DATABASE_PATH")
    : path.resolve(SERVER_ROOT, env("DATABASE_PATH", "./data/slide_maker.db")),
  corsOrigins: env("CORS_ORIGINS", "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  contentDecksPath: path.isAbsolute(env("CONTENT_DECKS_PATH"))
    ? env("CONTENT_DECKS_PATH")
    : path.resolve(SERVER_ROOT, env("CONTENT_DECKS_PATH", "../../content/decks")),
  maxSlides: Number(env("MAX_SLIDES", "12")) || 12,
  maxOutlineChapters: Number(env("MAX_OUTLINE_CHAPTERS", "6")) || 6,
};
