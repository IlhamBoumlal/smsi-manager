import dotenv from "dotenv";
import { resolve } from "node:path";

dotenv.config();

function toPositiveNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const SMSI_API_BASE_URL = (process.env.SMSI_API_BASE_URL || "http://localhost:5006").replace(/\/+$/, "");
export const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434").replace(/\/+$/, "");
export const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

export const REQUEST_TIMEOUT_MS = toPositiveNumber(process.env.REQUEST_TIMEOUT_MS, 60000);
export const OLLAMA_REQUEST_TIMEOUT_MS = toPositiveNumber(
  process.env.OLLAMA_REQUEST_TIMEOUT_MS,
  Math.max(REQUEST_TIMEOUT_MS, 600000)
);
export const OLLAMA_FIRST_TOKEN_TIMEOUT_MS = toPositiveNumber(
  process.env.OLLAMA_FIRST_TOKEN_TIMEOUT_MS,
  OLLAMA_REQUEST_TIMEOUT_MS
);
export const OLLAMA_NUM_PREDICT = toPositiveNumber(process.env.OLLAMA_NUM_PREDICT, 512);
export const OLLAMA_FOLLOW_UP_NUM_PREDICT = toPositiveNumber(
  process.env.OLLAMA_FOLLOW_UP_NUM_PREDICT,
  Math.max(OLLAMA_NUM_PREDICT, 900)
);
export const CHATBOT_CONTEXT_CHAR_LIMIT = toPositiveNumber(process.env.CHATBOT_CONTEXT_CHAR_LIMIT, 8000);
export const MAX_HISTORY_MESSAGES = toPositiveNumber(process.env.MAX_HISTORY_MESSAGES, 16);
export const MAX_CONTEXT_ITEMS = toPositiveNumber(process.env.MAX_CONTEXT_ITEMS, 20);
export const SSE_HEARTBEAT_INTERVAL_MS = toPositiveNumber(process.env.SSE_HEARTBEAT_INTERVAL_MS, 15000);
export const STREAM_LOCK_MAX_MS = toPositiveNumber(
  process.env.STREAM_LOCK_MAX_MS,
  Math.max(OLLAMA_FIRST_TOKEN_TIMEOUT_MS + 30000, SSE_HEARTBEAT_INTERVAL_MS * 4)
);

export const CHATBOT_DB_PATH = resolve(
  process.cwd(),
  process.env.CHATBOT_DB_PATH || "data/chatbot.sqlite"
);
