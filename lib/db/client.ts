import { createClient, Client } from "@libsql/client";

let dbInstance: Client | null = null;

/**
 * 取得 LibSQL / SQLite 資料庫連線實例
 * 支援本機檔案 (file:weather.db) 與 Vercel / Turso 雲端 (libsql://...)
 */
export function getDbClient(): Client {
  if (dbInstance) {
    return dbInstance;
  }

  const url = process.env.DATABASE_URL?.trim() || "file:weather.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim() || undefined;

  dbInstance = createClient({
    url,
    authToken,
  });

  return dbInstance;
}
