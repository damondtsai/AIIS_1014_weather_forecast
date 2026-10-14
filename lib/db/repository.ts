import { getDbClient } from "./client";
import { initDatabase } from "./schema";
import { ForecastRecord } from "../types";

let isInitialized = false;

export async function ensureDbInitialized(): Promise<void> {
  if (!isInitialized) {
    await initDatabase();
    isInitialized = true;
  }
}

/**
 * 取得氣象預報記錄，支援區域與日期篩選
 */
export async function getForecasts(filter?: {
  region?: string;
  date?: string;
}): Promise<ForecastRecord[]> {
  await ensureDbInitialized();
  const db = getDbClient();

  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (filter?.region) {
    conditions.push("regionName = ?");
    args.push(filter.region);
  }

  if (filter?.date) {
    conditions.push("dataDate = ?");
    args.push(filter.date);
  }

  let sql = `
    SELECT 
      id, regionName, dataDate, startTime, endTime,
      minT, maxT, avgT, weather, weatherCode, pop, comfort, fetchedAt
    FROM TemperatureForecasts
  `;

  if (conditions.length > 0) {
    sql += ` WHERE ` + conditions.join(" AND ");
  }

  sql += ` ORDER BY dataDate ASC, regionName ASC`;

  const result = await db.execute({
    sql,
    args,
  });

  return result.rows.map((row) => ({
    id: typeof row.id === "number" ? row.id : Number(row.id),
    regionName: String(row.regionName),
    dataDate: String(row.dataDate),
    startTime: row.startTime ? String(row.startTime) : null,
    endTime: row.endTime ? String(row.endTime) : null,
    minT: row.minT !== null && row.minT !== undefined ? Number(row.minT) : null,
    maxT: row.maxT !== null && row.maxT !== undefined ? Number(row.maxT) : null,
    avgT: row.avgT !== null && row.avgT !== undefined ? Number(row.avgT) : null,
    weather: row.weather ? String(row.weather) : null,
    weatherCode: row.weatherCode ? String(row.weatherCode) : null,
    pop: row.pop !== null && row.pop !== undefined ? Number(row.pop) : null,
    comfort: row.comfort ? String(row.comfort) : null,
    fetchedAt: String(row.fetchedAt),
  }));
}

/**
 * UPSERT 批次寫入或更新氣象預報記錄
 * 依據 UNIQUE(regionName, dataDate, startTime, endTime) 防範重複建立
 */
export async function upsertForecasts(records: ForecastRecord[]): Promise<{
  inserted: number;
  updated: number;
  total: number;
}> {
  await ensureDbInitialized();
  const db = getDbClient();

  if (records.length === 0) {
    return { inserted: 0, updated: 0, total: 0 };
  }

  const upsertSql = `
    INSERT INTO TemperatureForecasts (
      regionName, dataDate, startTime, endTime,
      minT, maxT, avgT, weather, weatherCode, pop, comfort, fetchedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(regionName, dataDate, startTime, endTime) DO UPDATE SET
      minT = excluded.minT,
      maxT = excluded.maxT,
      avgT = excluded.avgT,
      weather = excluded.weather,
      weatherCode = excluded.weatherCode,
      pop = excluded.pop,
      comfort = excluded.comfort,
      fetchedAt = excluded.fetchedAt
  `;

  // 查詢現有總筆數以便比對新增或更新筆數
  const beforeCountResult = await db.execute("SELECT COUNT(*) as count FROM TemperatureForecasts");
  const beforeCount = Number(beforeCountResult.rows[0]?.count ?? 0);

  // 批次執行參數化 UPSERT
  const batchStatements = records.map((r) => ({
    sql: upsertSql,
    args: [
      r.regionName,
      r.dataDate,
      r.startTime ?? "",
      r.endTime ?? "",
      r.minT ?? null,
      r.maxT ?? null,
      r.avgT ?? null,
      r.weather ?? null,
      r.weatherCode ?? null,
      r.pop ?? null,
      r.comfort ?? null,
      r.fetchedAt,
    ],
  }));

  await db.batch(batchStatements, "write");

  const afterCountResult = await db.execute("SELECT COUNT(*) as count FROM TemperatureForecasts");
  const afterCount = Number(afterCountResult.rows[0]?.count ?? 0);

  const inserted = Math.max(0, afterCount - beforeCount);
  const updated = Math.max(0, records.length - inserted);

  return {
    inserted,
    updated,
    total: records.length,
  };
}

/**
 * 取得最新資料同步時間
 */
export async function getLatestFetchedAt(): Promise<string | null> {
  await ensureDbInitialized();
  const db = getDbClient();

  const result = await db.execute(
    "SELECT fetchedAt FROM TemperatureForecasts ORDER BY id DESC LIMIT 1"
  );
  if (result.rows.length === 0) {
    return null;
  }
  return String(result.rows[0]?.fetchedAt ?? "");
}

/**
 * 取得現有預報資料總筆數
 */
export async function getForecastCount(): Promise<number> {
  await ensureDbInitialized();
  const db = getDbClient();

  const result = await db.execute("SELECT COUNT(*) as count FROM TemperatureForecasts");
  return Number(result.rows[0]?.count ?? 0);
}
