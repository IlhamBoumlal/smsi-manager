import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import sqlite3 from "sqlite3";
import { CHATBOT_DB_PATH } from "../config.js";

let dbInstance = null;

function openDatabase(filePath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(filePath, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(db);
    });
  });
}

function runSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });
}

function getSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row || null);
    });
  });
}

function allSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(Array.isArray(rows) ? rows : []);
    });
  });
}

async function ensureChatConversationSchema(db) {
  const columns = await allSql(db, `PRAGMA table_info(ChatConversation)`);
  const hasLastMethod = columns.some(
    (column) => String(column?.name || "").toLowerCase() === "lastmethod"
  );

  if (!hasLastMethod) {
    await runSql(db, `ALTER TABLE ChatConversation ADD COLUMN lastMethod TEXT NULL`);
  }
}

export async function initDatabase() {
  if (dbInstance) return dbInstance;

  mkdirSync(dirname(CHATBOT_DB_PATH), { recursive: true });
  const db = await openDatabase(CHATBOT_DB_PATH);
  db.serialize();

  await runSql(
    db,
    `
      CREATE TABLE IF NOT EXISTS ChatConversation (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        lastMethod TEXT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        deletedAt TEXT NULL
      )
    `
  );

  await ensureChatConversationSchema(db);

  await runSql(
    db,
    `
      CREATE TABLE IF NOT EXISTS ChatMessage (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (conversationId) REFERENCES ChatConversation(id)
      )
    `
  );

  await runSql(
    db,
    `CREATE INDEX IF NOT EXISTS IX_ChatConversation_UserId_UpdatedAt ON ChatConversation(userId, updatedAt DESC)`
  );
  await runSql(
    db,
    `CREATE INDEX IF NOT EXISTS IX_ChatConversation_DeletedAt ON ChatConversation(deletedAt)`
  );
  await runSql(
    db,
    `CREATE INDEX IF NOT EXISTS IX_ChatMessage_ConversationId_CreatedAt ON ChatMessage(conversationId, createdAt ASC)`
  );

  dbInstance = db;
  return dbInstance;
}

export async function runQuery(sql, params = []) {
  const db = await initDatabase();
  return runSql(db, sql, params);
}

export async function getQuery(sql, params = []) {
  const db = await initDatabase();
  return getSql(db, sql, params);
}

export async function allQuery(sql, params = []) {
  const db = await initDatabase();
  return allSql(db, sql, params);
}
