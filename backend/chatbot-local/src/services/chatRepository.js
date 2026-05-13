import { randomUUID } from "node:crypto";
import { allQuery, getQuery, runQuery } from "../db/database.js";

function nowIso() {
  return new Date().toISOString();
}

function normalizeTitle(rawTitle) {
  const value = String(rawTitle || "").trim();
  if (!value) return "Nouvelle conversation";
  return value.slice(0, 120);
}

function conversationRowToModel(row) {
  if (!row) return null;
  const societeId =
    row.societeId === null || row.societeId === undefined ? null : Number(row.societeId);
  return {
    id: row.id,
    userId: row.userId,
    societeId: Number.isFinite(societeId) ? societeId : null,
    title: row.title,
    lastMethod: row.lastMethod || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
    lastMessageAt: row.lastMessageAt || null,
    lastMessagePreview: row.lastMessagePreview || null,
    messageCount: Number(row.messageCount || 0),
  };
}

function normalizeSocieteId(value) {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized <= 0) return null;
  return normalized;
}

function buildSocieteScope(alias, societeId) {
  const scopedAlias = String(alias || "").trim();
  const column = scopedAlias ? `${scopedAlias}.societeId` : "societeId";
  const normalizedSocieteId = normalizeSocieteId(societeId);

  if (normalizedSocieteId === null) {
    return {
      clause: "1 = 0",
      params: [],
      normalizedSocieteId: null,
    };
  }

  return {
    clause: `${column} = ?`,
    params: [normalizedSocieteId],
    normalizedSocieteId,
  };
}

function messageRowToModel(row) {
  if (!row) return null;
  return {
    id: row.id,
    conversationId: row.conversationId,
    role: row.role,
    content: row.content,
    createdAt: row.createdAt,
  };
}

export async function createConversationForUser(userId, societeId, title = "") {
  const id = randomUUID();
  const createdAt = nowIso();
  const normalizedTitle = normalizeTitle(title);
  const normalizedSocieteId = normalizeSocieteId(societeId);

  if (normalizedSocieteId === null) {
    throw new Error("Conversation chatbot invalide: societeId obligatoire.");
  }

  await runQuery(
    `
      INSERT INTO ChatConversation (id, userId, societeId, title, lastMethod, createdAt, updatedAt, deletedAt)
      VALUES (?, ?, ?, ?, NULL, ?, ?, NULL)
    `,
    [id, userId, normalizedSocieteId, normalizedTitle, createdAt, createdAt]
  );

  return {
    id,
    userId,
    societeId: normalizedSocieteId,
    title: normalizedTitle,
    lastMethod: null,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
    messageCount: 0,
    lastMessageAt: null,
    lastMessagePreview: null,
  };
}

export async function listConversationsByUser(userId, societeId) {
  const scope = buildSocieteScope("c", societeId);
  const rows = await allQuery(
    `
      SELECT
        c.id,
        c.userId,
        c.societeId,
        c.title,
        c.lastMethod,
        c.createdAt,
        c.updatedAt,
        c.deletedAt,
        (
          SELECT m.createdAt
          FROM ChatMessage m
          WHERE m.conversationId = c.id
          ORDER BY m.createdAt DESC
          LIMIT 1
        ) AS lastMessageAt,
        (
          SELECT SUBSTR(m.content, 1, 180)
          FROM ChatMessage m
          WHERE m.conversationId = c.id
          ORDER BY m.createdAt DESC
          LIMIT 1
        ) AS lastMessagePreview,
        (
          SELECT COUNT(1)
          FROM ChatMessage m
          WHERE m.conversationId = c.id
        ) AS messageCount
      FROM ChatConversation c
      WHERE c.userId = ? AND ${scope.clause} AND c.deletedAt IS NULL
      ORDER BY c.updatedAt DESC
    `,
    [userId, ...scope.params]
  );

  return rows.map(conversationRowToModel);
}

export async function getConversationById(conversationId, societeId) {
  const scope = buildSocieteScope("c", societeId);
  const row = await getQuery(
    `
      SELECT
        c.id,
        c.userId,
        c.societeId,
        c.title,
        c.lastMethod,
        c.createdAt,
        c.updatedAt,
        c.deletedAt,
        (
          SELECT m.createdAt
          FROM ChatMessage m
          WHERE m.conversationId = c.id
          ORDER BY m.createdAt DESC
          LIMIT 1
        ) AS lastMessageAt,
        (
          SELECT SUBSTR(m.content, 1, 180)
          FROM ChatMessage m
          WHERE m.conversationId = c.id
          ORDER BY m.createdAt DESC
          LIMIT 1
        ) AS lastMessagePreview,
        (
          SELECT COUNT(1)
          FROM ChatMessage m
          WHERE m.conversationId = c.id
        ) AS messageCount
      FROM ChatConversation c
      WHERE c.id = ? AND ${scope.clause}
      LIMIT 1
    `,
    [conversationId, ...scope.params]
  );

  return conversationRowToModel(row);
}

export async function assertConversationOwnership(conversationId, userId, societeId, options = {}) {
  const includeDeleted = Boolean(options.includeDeleted);
  const conversation = await getConversationById(conversationId, societeId);

  if (!conversation) {
    return {
      ok: false,
      status: 404,
      code: "CHATBOT_CONVERSATION_NOT_FOUND",
      message: "Conversation introuvable.",
    };
  }

  if (conversation.userId !== userId) {
    return {
      ok: false,
      status: 403,
      code: "CHATBOT_FORBIDDEN",
      message: "Acces interdit a cette conversation.",
    };
  }

  if (!includeDeleted && conversation.deletedAt) {
    return {
      ok: false,
      status: 404,
      code: "CHATBOT_CONVERSATION_NOT_FOUND",
      message: "Conversation introuvable.",
    };
  }

  return { ok: true, conversation };
}

export async function listMessagesByConversation(conversationId, userId, societeId) {
  const normalizedSocieteId = normalizeSocieteId(societeId);
  if (normalizedSocieteId === null) return [];

  const rows = await allQuery(
    `
      SELECT id, conversationId, role, content, createdAt
      FROM ChatMessage
      WHERE conversationId = ? AND userId = ? AND societeId = ?
      ORDER BY createdAt ASC
    `,
    [conversationId, userId, normalizedSocieteId]
  );

  return rows.map(messageRowToModel);
}

export async function listRecentDialogMessages(conversationId, userId, societeId, limit = 16) {
  const normalizedSocieteId = normalizeSocieteId(societeId);
  if (normalizedSocieteId === null) return [];

  const rows = await allQuery(
    `
      SELECT id, conversationId, role, content, createdAt
      FROM ChatMessage
      WHERE conversationId = ? AND userId = ? AND societeId = ? AND role IN ('user', 'assistant')
      ORDER BY createdAt DESC
      LIMIT ?
    `,
    [conversationId, userId, normalizedSocieteId, limit]
  );

  return rows.map(messageRowToModel).reverse();
}

export async function insertMessage(conversationId, userId, societeId, role, content) {
  const normalizedSocieteId = normalizeSocieteId(societeId);
  if (normalizedSocieteId === null) {
    throw new Error("Message chatbot invalide: societeId obligatoire.");
  }

  const id = randomUUID();
  const createdAt = nowIso();
  await runQuery(
    `
      INSERT INTO ChatMessage (id, conversationId, userId, societeId, role, content, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [id, conversationId, userId, normalizedSocieteId, role, content, createdAt]
  );

  await runQuery(
    `
      UPDATE ChatConversation
      SET updatedAt = ?
      WHERE id = ?
    `,
    [createdAt, conversationId]
  );

  return {
    id,
    conversationId,
    role,
    content,
    createdAt,
  };
}

export async function softDeleteConversation(conversationId, societeId) {
  const deletedAt = nowIso();
  const scope = buildSocieteScope("", societeId);
  await runQuery(
    `
      UPDATE ChatConversation
      SET deletedAt = ?, updatedAt = ?
      WHERE id = ? AND ${scope.clause} AND deletedAt IS NULL
    `,
    [deletedAt, deletedAt, conversationId, ...scope.params]
  );

  return {
    id: conversationId,
    deletedAt,
  };
}

export async function updateConversationTitle(conversationId, societeId, title) {
  const normalizedTitle = normalizeTitle(title);
  const updatedAt = nowIso();
  const scope = buildSocieteScope("", societeId);

  await runQuery(
    `
      UPDATE ChatConversation
      SET title = ?, updatedAt = ?
      WHERE id = ? AND ${scope.clause} AND deletedAt IS NULL
    `,
    [normalizedTitle, updatedAt, conversationId, ...scope.params]
  );

  return normalizedTitle;
}

export async function updateConversationLastMethod(conversationId, societeId, lastMethod) {
  const scope = buildSocieteScope("", societeId);
  await runQuery(
    `
      UPDATE ChatConversation
      SET lastMethod = ?
      WHERE id = ? AND ${scope.clause} AND deletedAt IS NULL
    `,
    [lastMethod || null, conversationId, ...scope.params]
  );

  return lastMethod || null;
}

export function makeTitleFromFirstMessage(content) {
  const trimmed = String(content || "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "Nouvelle conversation";
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed;
}
