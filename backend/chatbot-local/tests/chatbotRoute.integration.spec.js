import assert from "node:assert/strict";
import { mkdirSync, rmSync } from "node:fs";
import { createServer as createHttpServer } from "node:http";
import path from "node:path";
import process from "node:process";
import express from "express";

const TEST_TMP_DIR = path.resolve(process.cwd(), "tests", "tmp");
const TEST_DB_PATH = path.join(TEST_TMP_DIR, "chatbot-route.integration.sqlite");

function createFakeJwt(payload = {}) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.signature`;
}

const TOKENS = {
  USER_1: createFakeJwt({ sub: "user-1", role: "User" }),
  USER_2: createFakeJwt({ sub: "user-2", role: "User" }),
  NO_CHATBOT: createFakeJwt({ sub: "user-no-chatbot", role: "User" }),
  NO_COMPANY: createFakeJwt({ sub: "user-no-company", role: "User" }),
  SUPERADMIN: createFakeJwt({ sub: "superadmin", role: "SuperAdmin" }),
  INVALID: "invalid-token",
};

function authHeader(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function parseBearer(req) {
  const header = String(req.headers.authorization || "").trim();
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice("bearer ".length).trim();
}

function json(res, status, payload) {
  res.status(status).json(payload);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startServer(app) {
  const server = createHttpServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  const baseUrl = `http://127.0.0.1:${port}`;
  return { server, baseUrl };
}

async function closeServer(server) {
  if (!server) return;
  await new Promise((resolve) => server.close(() => resolve()));
}

function buildPermissionPayload(modulePermissions) {
  return {
    modules: modulePermissions.map((entry) => {
      if (typeof entry === "string") {
        return {
          moduleCode: entry,
          actions: [{ actionCode: "read" }],
        };
      }

      const moduleCode = String(entry?.moduleCode || "").trim();
      const actions = Array.isArray(entry?.actions) && entry.actions.length > 0
        ? entry.actions
        : ["read"];

      return {
        moduleCode,
        actions: actions.map((actionCode) => ({ actionCode })),
      };
    }),
  };
}

function buildSmsiMockApp() {
  const app = express();
  app.use(express.json());

  const usersByToken = new Map([
    [
      TOKENS.USER_1,
      { id: "user-1", email: "user1@smsi.local", nomComplet: "User One", societeId: 1 },
    ],
    [
      TOKENS.USER_2,
      { id: "user-2", email: "user2@smsi.local", nomComplet: "User Two", societeId: 1 },
    ],
    [
      TOKENS.NO_CHATBOT,
      {
        id: "user-no-chatbot",
        email: "noch@smsi.local",
        nomComplet: "User No Chatbot",
        societeId: 1,
      },
    ],
    [
      TOKENS.NO_COMPANY,
      {
        id: "user-no-company",
        email: "noco@smsi.local",
        nomComplet: "User No Company",
        societeId: null,
      },
    ],
    [
      TOKENS.SUPERADMIN,
      {
        id: "superadmin",
        email: "superadmin@smsi.local",
        nomComplet: "Super Admin",
        societeId: 1,
      },
    ],
  ]);

  const fullReadModules = [
    "dashboard",
    "incidents",
    "risques",
    "controles",
    "audit",
    "actifs",
    "clauses",
    "pdca",
    "documentation",
    "sensibilisation",
    { moduleCode: "chatbot", actions: ["use"] },
  ];

  app.get("/api/auth/me", (req, res) => {
    const token = parseBearer(req);
    const user = usersByToken.get(token);
    if (!user) return json(res, 401, { error: "Unauthorized" });
    return json(res, 200, user);
  });

  app.get("/api/User/me/permissions", (req, res) => {
    const token = parseBearer(req);
    if (!usersByToken.has(token)) return json(res, 401, { error: "Unauthorized" });

    if (token === TOKENS.NO_CHATBOT) {
      return json(res, 200, buildPermissionPayload(["dashboard", "incidents"]));
    }

    return json(res, 200, buildPermissionPayload(fullReadModules));
  });

  app.get("/api/incidents", (_req, res) =>
    json(res, 200, [
      {
        id: "inc-1",
        titre: "Incident phishing",
        statut: "Open",
        priorite: "Haute",
        date: "2026-05-21T09:00:00Z",
      },
    ])
  );

  app.get("/api/dashboard/global", (_req, res) =>
    json(res, 200, {
      tauxGlobalConformite: 84,
      totalActifs: 2,
      totalControles: 5,
      controlesParStatut: [
        { statut: "Conforme", count: 4 },
        { statut: "NC", count: 1 },
      ],
      controlesParDomaine: [
        { domaine: "Organisationnel", count: 2 },
        { domaine: "Technologique", count: 3 },
      ],
    })
  );

  app.get("/api/risques/studies", (_req, res) =>
    json(res, 200, [
      {
        id: "risk-1",
        name: "Etude SI Interne",
        organization: "Societe A",
        author: "Alice",
        perimeter: "SI Interne",
        payloadJson: JSON.stringify({
          workshop5: { riskEntries: [{ name: "Ransomware", gravity: 4, likelihood: 3 }] },
        }),
      },
    ])
  );

  app.get("/api/controles", (_req, res) => json(res, 200, []));
  app.get("/api/actifs", (_req, res) => json(res, 200, []));
  app.get("/api/audits", (_req, res) => json(res, 200, []));
  app.get("/api/audits/ncs", (_req, res) => json(res, 200, []));
  app.get("/api/sensibilisation", (_req, res) => json(res, 200, []));
  app.get("/api/sensibilisation/dashboard", (_req, res) =>
    json(res, 200, { total: 0, planifiees: 0, enCours: 0, terminees: 0, tauxMoyen: 0 })
  );
  app.get("/api/clauses/dashboard", (_req, res) => json(res, 200, []));
  app.get("/api/clauses/stats", (_req, res) =>
    json(res, 200, {
      totalClauses: 0,
      averageConformity: 0,
      conformeClauses: 0,
      partialClauses: 0,
      nonConformeClauses: 0,
      totalActions: 0,
      delayedActions: 0,
    })
  );
  app.get("/api/pdca/cycles", (_req, res) => json(res, 200, []));
  app.get("/api/documentation", (_req, res) => json(res, 200, []));

  return app;
}

function buildOllamaMockApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.post("/api/chat", async (req, res) => {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const lastUserMessage = String(messages[messages.length - 1]?.content || "");
    const isLongLockScenario = lastUserMessage.toLowerCase().includes("lock-test");

    res.status(200);
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");

    if (isLongLockScenario) {
      await delay(350);
    }

    const chunk = JSON.stringify({
      message: { content: "Analyse en cours. " },
      done: false,
    });
    res.write(`${chunk}\n`);

    if (isLongLockScenario) {
      await delay(700);
    }

    const donePayload = JSON.stringify({
      done: true,
      done_reason: "stop",
      eval_count: 10,
      prompt_eval_count: 20,
      total_duration: 1000000,
    });
    res.write(`${donePayload}\n`);
    res.end();
  });

  return app;
}

function buildChatbotTestApp(chatbotRouter) {
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/chatbot", chatbotRouter);
  app.use((err, _req, res, _next) => {
    const status = Number(err?.status) || 500;
    res.status(status).json({
      error: err?.message || "Erreur interne du service chatbot.",
      code: err?.code || "CHATBOT_INTERNAL_ERROR",
      details: err?.details || undefined,
    });
  });
  return app;
}

async function requestJson(baseUrl, pathName, { method = "GET", token = "", body = null } = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: body === null ? undefined : JSON.stringify(body),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { response, payload };
}

async function run() {
  mkdirSync(TEST_TMP_DIR, { recursive: true });
  rmSync(TEST_DB_PATH, { force: true });

  const smsiMock = await startServer(buildSmsiMockApp());
  const ollamaMock = await startServer(buildOllamaMockApp());

  process.env.SMSI_API_BASE_URL = smsiMock.baseUrl;
  process.env.OLLAMA_BASE_URL = ollamaMock.baseUrl;
  process.env.CHATBOT_DB_PATH = TEST_DB_PATH;
  process.env.OLLAMA_MODEL = "llama3.2:3b";
  process.env.REQUEST_TIMEOUT_MS = "15000";
  process.env.OLLAMA_REQUEST_TIMEOUT_MS = "15000";
  process.env.OLLAMA_FIRST_TOKEN_TIMEOUT_MS = "15000";
  process.env.OLLAMA_NUM_PREDICT = "256";
  process.env.OLLAMA_FOLLOW_UP_NUM_PREDICT = "400";
  process.env.CHATBOT_MAX_MESSAGE_CHARS = "4000";
  process.env.CHATBOT_RATE_LIMIT_WINDOW_MS = "60000";
  process.env.CHATBOT_RATE_LIMIT_MAX_REQUESTS = "3";
  process.env.SSE_HEARTBEAT_INTERVAL_MS = "200";
  process.env.STREAM_LOCK_MAX_MS = "15000";

  const { default: chatbotRouter } = await import("../src/routes/chatbotRoute.js");
  const { initDatabase } = await import("../src/db/database.js");
  await initDatabase();

  const chatbot = await startServer(buildChatbotTestApp(chatbotRouter));

  try {
    {
      const { response, payload } = await requestJson(chatbot.baseUrl, "/api/chatbot/conversations", {
        method: "POST",
        body: { title: "x" },
      });
      assert.equal(response.status, 401);
      assert.equal(payload?.code, "CHATBOT_AUTH_REQUIRED");
    }

    {
      const { response, payload } = await requestJson(chatbot.baseUrl, "/api/chatbot/conversations", {
        method: "POST",
        token: TOKENS.SUPERADMIN,
        body: { title: "x" },
      });
      assert.equal(response.status, 403);
      assert.equal(payload?.code, "CHATBOT_SUPERADMIN_FORBIDDEN");
    }

    {
      const { response, payload } = await requestJson(chatbot.baseUrl, "/api/chatbot/conversations", {
        method: "POST",
        token: TOKENS.NO_CHATBOT,
        body: { title: "x" },
      });
      assert.equal(response.status, 403);
      assert.equal(payload?.code, "CHATBOT_PERMISSION_DENIED");
    }

    {
      const { response, payload } = await requestJson(chatbot.baseUrl, "/api/chatbot/conversations", {
        method: "POST",
        token: TOKENS.NO_COMPANY,
        body: { title: "x" },
      });
      assert.equal(response.status, 403);
      assert.equal(payload?.code, "CHATBOT_COMPANY_SCOPE_REQUIRED");
    }

    let conversationId = "";
    {
      const { response, payload } = await requestJson(chatbot.baseUrl, "/api/chatbot/conversations", {
        method: "POST",
        token: TOKENS.USER_1,
        body: { title: "Conversation test integration" },
      });
      assert.equal(response.status, 201);
      assert.ok(payload?.conversation?.id);
      conversationId = String(payload.conversation.id);
    }

    {
      const { response, payload } = await requestJson(chatbot.baseUrl, "/api/chatbot/conversations", {
        method: "GET",
        token: TOKENS.USER_1,
      });
      assert.equal(response.status, 200);
      assert.ok(Array.isArray(payload?.conversations));
      assert.ok(payload.conversations.some((row) => row.id === conversationId));
    }

    {
      const { response, payload } = await requestJson(
        chatbot.baseUrl,
        `/api/chatbot/conversations/${conversationId}/messages`,
        {
          method: "POST",
          token: TOKENS.USER_1,
          body: { message: "affiche les incidents" },
        }
      );
      assert.equal(response.status, 201);
      assert.equal(payload?.assistantMessage?.role, "assistant");
      assert.match(String(payload?.assistantMessage?.content || ""), /incidents/i);
    }

    {
      const { response, payload } = await requestJson(
        chatbot.baseUrl,
        `/api/chatbot/conversations/${conversationId}/messages`,
        {
          method: "GET",
          token: TOKENS.USER_1,
        }
      );
      assert.equal(response.status, 200);
      assert.ok(Array.isArray(payload?.messages));
      assert.ok(payload.messages.length >= 2);
    }

    {
      const { response, payload } = await requestJson(
        chatbot.baseUrl,
        `/api/chatbot/conversations/${conversationId}/messages`,
        {
          method: "GET",
          token: TOKENS.USER_2,
        }
      );
      assert.equal(response.status, 403);
      assert.equal(payload?.code, "CHATBOT_FORBIDDEN");
    }

    {
      const { response, payload } = await requestJson(
        chatbot.baseUrl,
        `/api/chatbot/conversations/${conversationId}/messages`,
        {
          method: "POST",
          token: TOKENS.USER_1,
          body: { message: "   " },
        }
      );
      assert.equal(response.status, 400);
      assert.equal(payload?.code, "CHATBOT_INVALID_MESSAGE");
    }

    {
      const tooLongMessage = "x".repeat(4001);
      const { response, payload } = await requestJson(
        chatbot.baseUrl,
        `/api/chatbot/conversations/${conversationId}/messages`,
        {
          method: "POST",
          token: TOKENS.USER_1,
          body: { message: tooLongMessage },
        }
      );
      assert.equal(response.status, 413);
      assert.equal(payload?.code, "CHATBOT_MESSAGE_TOO_LONG");
    }

    {
      const streamPath = `/api/chatbot/conversations/${conversationId}/messages/stream`;
      const firstStream = fetch(`${chatbot.baseUrl}${streamPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(TOKENS.USER_1),
        },
        body: JSON.stringify({ message: "analyse lock-test" }),
      });

      await delay(120);

      const second = await requestJson(chatbot.baseUrl, streamPath, {
        method: "POST",
        token: TOKENS.USER_1,
        body: { message: "analyse lock-test bis" },
      });
      assert.equal(second.response.status, 409);
      assert.equal(second.payload?.code, "CHATBOT_STREAM_IN_PROGRESS");

      const firstResponse = await firstStream;
      assert.equal(firstResponse.status, 200);
      const firstText = await firstResponse.text();
      assert.match(firstText, /event: done/i);
    }

    {
      const created = await requestJson(chatbot.baseUrl, "/api/chatbot/conversations", {
        method: "POST",
        token: TOKENS.USER_2,
        body: { title: "Rate limit conversation" },
      });
      assert.equal(created.response.status, 201);
      const user2ConversationId = String(created.payload?.conversation?.id || "");
      assert.ok(user2ConversationId);

      for (let index = 0; index < 3; index += 1) {
        const current = await requestJson(
          chatbot.baseUrl,
          `/api/chatbot/conversations/${user2ConversationId}/messages`,
          {
            method: "POST",
            token: TOKENS.USER_2,
            body: { message: `affiche les incidents ${index}` },
          }
        );
        assert.equal(current.response.status, 201);
      }

      const blocked = await requestJson(
        chatbot.baseUrl,
        `/api/chatbot/conversations/${user2ConversationId}/messages`,
        {
          method: "POST",
          token: TOKENS.USER_2,
          body: { message: "affiche les incidents limite" },
        }
      );
      assert.equal(blocked.response.status, 429);
      assert.equal(blocked.payload?.code, "CHATBOT_RATE_LIMITED");
    }
  } finally {
    await closeServer(chatbot.server);
    await closeServer(ollamaMock.server);
    await closeServer(smsiMock.server);
  }

  console.log("Chatbot route integration tests passed.");
}

run().catch((error) => {
  console.error(`Chatbot route integration tests failed: ${String(error?.stack || error)}`);
  process.exitCode = 1;
});
