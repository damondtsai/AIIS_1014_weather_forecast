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

  let url = process.env.DATABASE_URL?.trim() || "file:weather.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN?.trim() || undefined;

  // 在 Vercel 或 Serverless 雲端環境下，/var/task 目錄為唯讀，SQLite 實體檔案必須指向 /tmp/
  if (
    (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.platform === "linux") &&
    url.startsWith("file:") &&
    !url.startsWith("file:/tmp/")
  ) {
    url = "file:/tmp/weather.db";
  }

  dbInstance = createClient({
    url,
    authToken,
  });

  return dbInstance;
}
