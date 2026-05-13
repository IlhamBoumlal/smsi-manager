import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import chatbotRouter from "./routes/chatbotRoute.js";
import { initDatabase } from "./db/database.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5055);

const defaultOrigins = ["http://localhost:3000", "http://localhost:5173"];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || defaultOrigins.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin non autorisee par le service chatbot."));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.json({
    service: "smsi-chatbot-local",
    status: "running",
    endpoints: {
      health: "/health",
      chatbotBase: "/api/chatbot",
      conversations: "/api/chatbot/conversations",
    },
    note: "Ce service est une API (pas une interface web). Utilisez le frontend sur http://localhost:3000.",
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "smsi-chatbot-local",
    model: process.env.OLLAMA_MODEL || "llama3.2:3b",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/chatbot", chatbotRouter);

app.use((err, _req, res, _next) => {
  const status = Number(err?.status) || 500;
  res.status(status).json({
    error: err?.message || "Erreur interne du service chatbot.",
    code: err?.code || "CHATBOT_INTERNAL_ERROR",
  });
});

async function bootstrap() {
  await initDatabase();
  app.listen(port, () => {
    console.log(`[chatbot] Service demarre sur http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("[chatbot] Echec du demarrage:", error);
  process.exit(1);
});
