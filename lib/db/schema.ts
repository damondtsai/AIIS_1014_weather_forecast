import { getDbClient } from "./client";

export const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS TemperatureForecasts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    regionName TEXT NOT NULL,
    dataDate TEXT NOT NULL,
    startTime TEXT,
    endTime TEXT,
    minT REAL,
    maxT REAL,
    avgT REAL,
    weather TEXT,
    weatherCode TEXT,
    pop REAL,
    comfort TEXT,
    fetchedAt TEXT NOT NULL,
    UNIQUE(regionName, dataDate, startTime, endTime)
);
`;

export const CREATE_INDEX_SQL = `
CREATE INDEX IF NOT EXISTS idx_forecast_region_date
ON TemperatureForecasts(regionName, dataDate);
`;

/**
 * 初始化資料庫表格與索引
 */
export async function initDatabase(): Promise<void> {
  const db = getDbClient();
  await db.execute(CREATE_TABLE_SQL);
  await db.execute(CREATE_INDEX_SQL);
}
