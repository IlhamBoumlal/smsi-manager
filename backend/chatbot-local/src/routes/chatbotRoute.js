import { Router } from "express";
import {
  MAX_HISTORY_MESSAGES,
  OLLAMA_FIRST_TOKEN_TIMEOUT_MS,
  OLLAMA_MODEL,
  SSE_HEARTBEAT_INTERVAL_MS,
  STREAM_LOCK_MAX_MS,
} from "../config.js";
import { requireAuthenticatedUser } from "../middleware/auth.js";
import {
  ChatbotServiceError,
  buildChatbotResponse,
  detectConversationMethodFromMessage,
  generateAssistantReply,
  normalizeConversationMethod,
  streamAssistantReply,
} from "../services/chatbotService.js";
import { routeIntent } from "../services/intentRouterService.js";
import {
  assertConversationOwnership,
  createConversationForUser,
  insertMessage,
  listConversationsByUser,
  listMessagesByConversation,
  listRecentDialogMessages,
  makeTitleFromFirstMessage,
  softDeleteConversation,
  updateConversationLastMethod,
  updateConversationTitle,
} from "../services/chatRepository.js";

const router = Router();
const activeConversationStreams = new Map();

function normalizeMessage(value) {
  return String(value || "").trim();
}

function resolveLastMethodFromDialog(message, history = [], currentLastMethod = null) {
  const fromCurrentMessage = detectConversationMethodFromMessage(message);
  if (fromCurrentMessage) return fromCurrentMessage;

  const rows = Array.isArray(history) ? history : [];
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (!row || typeof row !== "object") continue;
    if (String(row.role || "").trim().toLowerCase() !== "user") continue;
    const detected = detectConversationMethodFromMessage(row.content || "");
    if (detected) return detected;
  }

  return normalizeConversationMethod(currentLastMethod);
}

function mapChatbotError(error) {
  if (error instanceof ChatbotServiceError) return error;
  return new ChatbotServiceError(
    "Erreur interne du module chatbot.",
    500,
    "CHATBOT_INTERNAL_ERROR"
  );
}

function sendError(res, error) {
  const normalized = mapChatbotError(error);
  return res.status(normalized.status).json({
    error: normalized.message,
    code: normalized.code,
    details: normalized.details || undefined,
  });
}

function writeSseEvent(res, event, payload) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

function buildStreamKey(userId, conversationId) {
  return `${String(userId || "").trim()}::${String(conversationId || "").trim()}`;
}

function isLockStale(lock) {
  if (!lock || typeof lock !== "object") return true;
  const lastActivityAtMs = Number(lock.lastActivityAtMs || lock.startedAtMs || 0);
  if (!Number.isFinite(lastActivityAtMs) || lastActivityAtMs <= 0) return true;
  const idleMs = Date.now() - lastActivityAtMs;
  return idleMs > STREAM_LOCK_MAX_MS;
}

function touchLock(streamKey, state) {
  const lock = activeConversationStreams.get(streamKey);
  if (!lock) return;
  lock.lastActivityAtMs = Date.now();
  if (state) lock.state = state;
}

function cleanupLock(streamKey) {
  activeConversationStreams.delete(streamKey);
}

function lockIdleMs(lock) {
  return Date.now() - Number(lock?.lastActivityAtMs || lock?.startedAtMs || Date.now());
}

router.use(requireAuthenticatedUser);

router.post("/conversations", async (req, res) => {
  try {
    const userId = req.auth.user.id;
    const bodyTitle = String(req.body?.title || "").trim();
    const conversation = await createConversationForUser(userId, bodyTitle);
    return res.status(201).json({ conversation });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/conversations", async (req, res) => {
  try {
    const userId = req.auth.user.id;
    const conversations = await listConversationsByUser(userId);
    return res.json({ conversations });
  } catch (error) {
    return sendError(res, error);
  }
});

router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const conversationId = String(req.params.id || "").trim();
    const userId = req.auth.user.id;

    const access = await assertConversationOwnership(conversationId, userId);
    if (!access.ok) {
      throw new ChatbotServiceError(access.message, access.status, access.code);
    }

    const messages = await listMessagesByConversation(conversationId);

    return res.json({
      conversation: access.conversation,
      messages,
    });
  } catch (error) {
    return sendError(res, error);
  }
});

router.post("/conversations/:id/messages/stream", async (req, res) => {
  const conversationId = String(req.params.id || "").trim();
  const userId = req.auth.user.id;
  const message = normalizeMessage(req.body?.message);

  if (!message) {
    return sendError(
      res,
      new ChatbotServiceError(
        "Le champ 'message' est obligatoire.",
        400,
        "CHATBOT_INVALID_MESSAGE"
      )
    );
  }

  const streamKey = buildStreamKey(userId, conversationId);
  const existingLock = activeConversationStreams.get(streamKey);
  if (existingLock && isLockStale(existingLock)) {
    console.warn(
      `[chatbot][stream] stale_lock_removed conversation=${conversationId} user=${userId} state=${existingLock.state || "unknown"}`
    );
    existingLock.abortController?.abort?.("STALE_LOCK_REMOVED");
    cleanupLock(streamKey);
  } else if (existingLock) {
    return sendError(
      res,
      new ChatbotServiceError(
        "Un stream est deja en cours pour cette conversation.",
        409,
        "CHATBOT_STREAM_IN_PROGRESS",
        {
          state: existingLock.state || "unknown",
          idleMs: lockIdleMs(existingLock),
          lockMaxMs: STREAM_LOCK_MAX_MS,
        }
      )
    );
  }

  const streamAbortController = new AbortController();
  let clientClosed = false;
  let cleaned = false;
  let heartbeatTimer = null;
  let lockMaxTimer = null;

  const cleanup = (reason = "cleanup") => {
    if (cleaned) return;
    cleaned = true;
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    if (lockMaxTimer) {
      clearTimeout(lockMaxTimer);
      lockMaxTimer = null;
    }
    cleanupLock(streamKey);
    console.info(
      `[chatbot][stream] lock_released conversation=${conversationId} user=${userId} reason=${reason}`
    );
  };

  const handleClientClosed = () => {
    if (clientClosed) return;
    clientClosed = true;
    streamAbortController.abort("CLIENT_CONNECTION_CLOSED");
    cleanup("client_closed");
  };

  res.on("close", handleClientClosed);
  req.on("aborted", handleClientClosed);

  activeConversationStreams.set(streamKey, {
    startedAtMs: Date.now(),
    lastActivityAtMs: Date.now(),
    state: "starting",
    abortController: streamAbortController,
  });
  console.info(`[chatbot][stream] lock_acquired conversation=${conversationId} user=${userId}`);
  lockMaxTimer = setTimeout(() => {
    const lock = activeConversationStreams.get(streamKey);
    if (!lock) return;
    if (isLockStale(lock)) {
      console.warn(
        `[chatbot][stream] lock_timeout_cleanup conversation=${conversationId} user=${userId} idleMs=${Date.now() - Number(lock.lastActivityAtMs || lock.startedAtMs || Date.now())}`
      );
      streamAbortController.abort("STREAM_LOCK_IDLE_TIMEOUT");
      cleanup("lock_idle_timeout");
    }
  }, STREAM_LOCK_MAX_MS + 1000);

  try {
    const access = await assertConversationOwnership(conversationId, userId);
    if (!access.ok) {
      throw new ChatbotServiceError(access.message, access.status, access.code);
    }

    const previousDialog = await listRecentDialogMessages(conversationId, MAX_HISTORY_MESSAGES);
    const history = previousDialog.map((row) => ({
      role: row.role,
      content: row.content,
    }));
    const conversationLastMethod = normalizeConversationMethod(access.conversation.lastMethod);
    const detectedMethod = detectConversationMethodFromMessage(message);
    const effectiveLastMethod = detectedMethod || conversationLastMethod;

    if (detectedMethod && detectedMethod !== conversationLastMethod) {
      await updateConversationLastMethod(conversationId, detectedMethod);
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    if (typeof res.flushHeaders === "function") {
      res.flushHeaders();
    }

    const preIntent = routeIntent(message, history);
    writeSseEvent(res, "started", {
      conversationId,
      chatMode: preIntent.mode,
      followUp: Boolean(preIntent.followUp),
      followUpType: preIntent.followUpType || "none",
      lastMethod: effectiveLastMethod,
      model: OLLAMA_MODEL,
      firstTokenTimeoutMs: OLLAMA_FIRST_TOKEN_TIMEOUT_MS,
      heartbeatIntervalMs: SSE_HEARTBEAT_INTERVAL_MS,
      timestamp: new Date().toISOString(),
    });
    touchLock(streamKey, "started");

    heartbeatTimer = setInterval(() => {
      if (res.writableEnded || clientClosed) return;
      writeSseEvent(res, "heartbeat", { timestamp: new Date().toISOString() });
      touchLock(streamKey, "heartbeat");
    }, SSE_HEARTBEAT_INTERVAL_MS);

    let firstTokenLogged = false;
    const startedAt = Date.now();

    const { answer, context, metrics } = await streamAssistantReply({
      token: req.auth.token,
      message,
      history,
      lastMethod: effectiveLastMethod,
      signal: streamAbortController.signal,
      onFirstToken(meta) {
        if (!firstTokenLogged) {
          firstTokenLogged = true;
          touchLock(streamKey, "first_token");
          console.info(
            `[chatbot][stream] first_token conversation=${conversationId} user=${userId} elapsedMs=${meta.elapsedMs}`
          );
        }
      },
      onToken(chunk) {
        if (res.writableEnded || clientClosed) return;
        touchLock(streamKey, "token");
        writeSseEvent(res, "token", { content: chunk });
      },
    });

    if (clientClosed || res.writableEnded) {
      cleanup();
      return;
    }

    const userMessage = await insertMessage(conversationId, "user", message);

    if ((access.conversation.title || "").trim().toLowerCase() === "nouvelle conversation") {
      await updateConversationTitle(conversationId, makeTitleFromFirstMessage(message));
    }

    const assistantMessage = await insertMessage(conversationId, "assistant", answer);

    const totalElapsedMs = Date.now() - startedAt;
    console.info(
      `[chatbot][stream] completed conversation=${conversationId} user=${userId} firstTokenMs=${metrics?.firstTokenMs ?? "n/a"} totalMs=${metrics?.totalMs ?? totalElapsedMs}`
    );

    writeSseEvent(res, "done", {
      conversationId,
      userMessage,
      assistantMessage,
      mode: context.mode,
      chatMode: context.chatMode,
      hasData: context.hasData,
      missingSources: context.missingSources,
      missingOptionalSources: context.missingOptionalSources,
      appDataUsed: context.appDataUsed,
      documentUsed: context.documentUsed,
      ragUsed: context.ragUsed,
      followUp: context.followUp,
      followUpType: context.followUpType,
      lastMethod: context.lastMethod,
      methodUsedInResponse: context.methodUsedInResponse,
      model: OLLAMA_MODEL,
      generatedAt: new Date().toISOString(),
      metrics: {
        firstTokenMs: metrics?.firstTokenMs ?? null,
        totalMs: metrics?.totalMs ?? totalElapsedMs,
        firstTokenTimeoutMs: metrics?.firstTokenTimeoutMs ?? OLLAMA_FIRST_TOKEN_TIMEOUT_MS,
        numPredict: metrics?.numPredict ?? null,
        doneReason: metrics?.doneReason ?? "unknown",
        evalCount: metrics?.evalCount ?? null,
        promptEvalCount: metrics?.promptEvalCount ?? null,
      },
    });

    res.end();
    cleanup("completed");
  } catch (error) {
    const normalized = mapChatbotError(error);
    if (clientClosed) {
      cleanup("client_closed");
      return;
    }

    if (!res.headersSent) {
      cleanup("error_before_headers");
      return sendError(res, normalized);
    }

    if (!clientClosed && !res.writableEnded) {
      writeSseEvent(res, "error", {
        error: normalized.message,
        code: normalized.code,
        details: normalized.details || null,
      });
      res.end();
    }

    cleanup(normalized.code || "error");
  }
});

router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const conversationId = String(req.params.id || "").trim();
    const userId = req.auth.user.id;
    const message = normalizeMessage(req.body?.message);

    if (!message) {
      throw new ChatbotServiceError(
        "Le champ 'message' est obligatoire.",
        400,
        "CHATBOT_INVALID_MESSAGE"
      );
    }

    const access = await assertConversationOwnership(conversationId, userId);
    if (!access.ok) {
      throw new ChatbotServiceError(access.message, access.status, access.code);
    }

    const previousDialog = await listRecentDialogMessages(conversationId, MAX_HISTORY_MESSAGES);
    const history = previousDialog.map((row) => ({
      role: row.role,
      content: row.content,
    }));
    const conversationLastMethod = normalizeConversationMethod(access.conversation.lastMethod);
    const detectedMethod = detectConversationMethodFromMessage(message);
    const effectiveLastMethod = detectedMethod || conversationLastMethod;

    if (detectedMethod && detectedMethod !== conversationLastMethod) {
      await updateConversationLastMethod(conversationId, detectedMethod);
    }

    const { answer, context } = await generateAssistantReply({
      token: req.auth.token,
      message,
      history,
      lastMethod: effectiveLastMethod,
    });

    const userMessage = await insertMessage(conversationId, "user", message);

    if ((access.conversation.title || "").trim().toLowerCase() === "nouvelle conversation") {
      await updateConversationTitle(conversationId, makeTitleFromFirstMessage(message));
    }

    const assistantMessage = await insertMessage(conversationId, "assistant", answer);

    return res.status(201).json({
      conversationId,
      userMessage,
      assistantMessage,
      mode: context.mode,
      chatMode: context.chatMode,
      hasData: context.hasData,
      missingSources: context.missingSources,
      missingOptionalSources: context.missingOptionalSources,
      appDataUsed: context.appDataUsed,
      documentUsed: context.documentUsed,
      ragUsed: context.ragUsed,
      followUp: context.followUp,
      followUpType: context.followUpType,
      lastMethod: context.lastMethod,
      methodUsedInResponse: context.methodUsedInResponse,
      model: OLLAMA_MODEL,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return sendError(res, error);
  }
});

router.delete("/conversations/:id", async (req, res) => {
  try {
    const conversationId = String(req.params.id || "").trim();
    const userId = req.auth.user.id;

    const access = await assertConversationOwnership(conversationId, userId);
    if (!access.ok) {
      throw new ChatbotServiceError(access.message, access.status, access.code);
    }

    await softDeleteConversation(conversationId);
    return res.status(204).send();
  } catch (error) {
    return sendError(res, error);
  }
});

// Route legacy conservee pour compatibilite frontend existant.
router.post("/message", async (req, res) => {
  const message = normalizeMessage(req.body?.message);
  const history = Array.isArray(req.body?.history) ? req.body.history : [];
  const token = req.auth.token;

  if (!message) {
    return res.status(400).json({
      error: "Le champ 'message' est obligatoire.",
      code: "CHATBOT_INVALID_MESSAGE",
    });
  }

  try {
    const lastMethod = resolveLastMethodFromDialog(message, history, null);
    const result = await buildChatbotResponse({ message, history, token, lastMethod });
    return res.json(result);
  } catch (error) {
    return sendError(res, error);
  }
});

export default router;
