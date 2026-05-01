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
  return {
    id: row.id,
    userId: row.userId,
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

export async function createConversationForUser(userId, title = "") {
  const id = randomUUID();
  const createdAt = nowIso();
  const normalizedTitle = normalizeTitle(title);

  await runQuery(
    `
      INSERT INTO ChatConversation (id, userId, title, lastMethod, createdAt, updatedAt, deletedAt)
      VALUES (?, ?, ?, NULL, ?, ?, NULL)
    `,
    [id, userId, normalizedTitle, createdAt, createdAt]
  );

  return {
    id,
    userId,
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

export async function listConversationsByUser(userId) {
  const rows = await allQuery(
    `
      SELECT
        c.id,
        c.userId,
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
      WHERE c.userId = ? AND c.deletedAt IS NULL
      ORDER BY c.updatedAt DESC
    `,
    [userId]
  );

  return rows.map(conversationRowToModel);
}

export async function getConversationById(conversationId) {
  const row = await getQuery(
    `
      SELECT
        c.id,
        c.userId,
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
      WHERE c.id = ?
      LIMIT 1
    `,
    [conversationId]
  );

  return conversationRowToModel(row);
}

export async function assertConversationOwnership(conversationId, userId, options = {}) {
  const includeDeleted = Boolean(options.includeDeleted);
  const conversation = await getConversationById(conversationId);

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

export async function listMessagesByConversation(conversationId) {
  const rows = await allQuery(
    `
      SELECT id, conversationId, role, content, createdAt
      FROM ChatMessage
      WHERE conversationId = ?
      ORDER BY createdAt ASC
    `,
    [conversationId]
  );

  return rows.map(messageRowToModel);
}

export async function listRecentDialogMessages(conversationId, limit = 16) {
  const rows = await allQuery(
    `
      SELECT id, conversationId, role, content, createdAt
      FROM ChatMessage
      WHERE conversationId = ? AND role IN ('user', 'assistant')
      ORDER BY createdAt DESC
      LIMIT ?
    `,
    [conversationId, limit]
  );

  return rows.map(messageRowToModel).reverse();
}

export async function insertMessage(conversationId, role, content) {
  const id = randomUUID();
  const createdAt = nowIso();
  await runQuery(
    `
      INSERT INTO ChatMessage (id, conversationId, role, content, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `,
    [id, conversationId, role, content, createdAt]
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

export async function softDeleteConversation(conversationId) {
  const deletedAt = nowIso();
  await runQuery(
    `
      UPDATE ChatConversation
      SET deletedAt = ?, updatedAt = ?
      WHERE id = ? AND deletedAt IS NULL
    `,
    [deletedAt, deletedAt, conversationId]
  );

  return {
    id: conversationId,
    deletedAt,
  };
}

export async function updateConversationTitle(conversationId, title) {
  const normalizedTitle = normalizeTitle(title);
  const updatedAt = nowIso();

  await runQuery(
    `
      UPDATE ChatConversation
      SET title = ?, updatedAt = ?
      WHERE id = ? AND deletedAt IS NULL
    `,
    [normalizedTitle, updatedAt, conversationId]
  );

  return normalizedTitle;
}

export async function updateConversationLastMethod(conversationId, lastMethod) {
  await runQuery(
    `
      UPDATE ChatConversation
      SET lastMethod = ?
      WHERE id = ? AND deletedAt IS NULL
    `,
    [lastMethod || null, conversationId]
  );

  return lastMethod || null;
}

export function makeTitleFromFirstMessage(content) {
  const trimmed = String(content || "").replace(/\s+/g, " ").trim();
  if (!trimmed) return "Nouvelle conversation";
  return trimmed.length > 80 ? `${trimmed.slice(0, 80)}...` : trimmed;
}
