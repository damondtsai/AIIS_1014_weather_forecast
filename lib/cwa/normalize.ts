import { ForecastRecord } from "../types";
import { TAIWAN_REGIONS, TaiwanRegion } from "../regions";
import { CwaApiResponse } from "./schema";

/**
 * 將地點名稱正規化為六大標準地區
 */
export function mapToStandardRegion(rawName: string): TaiwanRegion | null {
  const trimmed = rawName.trim();
  if (TAIWAN_REGIONS.includes(trimmed as TaiwanRegion)) {
    return trimmed as TaiwanRegion;
  }
  if (trimmed === "北部") return "北部地區";
  if (trimmed === "中部") return "中部地區";
  if (trimmed === "南部") return "南部地區";
  if (trimmed === "東北部") return "東北部地區";
  if (trimmed === "東部") return "東部地區";
  if (trimmed === "東南部") return "東南部地區";

  // 包含字眼比對
  if (trimmed.includes("東北部")) return "東北部地區";
  if (trimmed.includes("東南部")) return "東南部地區";
  if (trimmed.includes("北部")) return "北部地區";
  if (trimmed.includes("中部")) return "中部地區";
  if (trimmed.includes("南部")) return "南部地區";
  if (trimmed.includes("東部")) return "東部地區";

  return null;
}

/**
 * 安全解析浮點數字串，若無效則回傳 null
 */
export function safeParseFloat(val: unknown): number | null {
  if (val === null || val === undefined) return null;
  const num = typeof val === "number" ? val : parseFloat(String(val).trim());
  return Number.isFinite(num) ? Math.round(num * 10) / 10 : null;
}

/**
 * 計算平均溫度
 * avgT = (minT + maxT) / 2
 */
export function calculateAverageTemperature(
  minT: number | null,
  maxT: number | null
): number | null {
  if (minT === null || maxT === null) return null;
  if (!Number.isFinite(minT) || !Number.isFinite(maxT)) return null;
  return Math.round(((minT + maxT) / 2) * 10) / 10;
}

/**
 * 從時間字串中提取日期 (YYYY-MM-DD)
 */
export function extractDateString(timeStr?: string): string {
  if (!timeStr) {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  }
  // 支援 "2026-10-14 18:00:00" 或 "2026-10-14T18:00:00+08:00"
  const match = timeStr.match(/^(\d{4}-\d{2}-\d{2})/);
  if (match) return match[1];
  return timeStr.slice(0, 10);
}

/**
 * 提取天氣元素值
 */
function extractValue(elementValue?: Array<{ value?: string; parameterName?: string; parameterValue?: string }>, parameter?: { parameterName?: string; parameterValue?: string }) {
  if (elementValue && elementValue.length > 0) {
    return {
      primary: elementValue[0]?.value ?? elementValue[0]?.parameterName ?? null,
      secondary: elementValue[1]?.value ?? elementValue[1]?.parameterValue ?? null,
    };
  }
  if (parameter) {
    return {
      primary: parameter.parameterName ?? parameter.parameterValue ?? null,
      secondary: parameter.parameterValue ?? null,
    };
  }
  return { primary: null, secondary: null };
}

/**
 * 將 CWA API 原始回應正規化為系統資料表記錄格式
 */
export function normalizeCwaForecasts(
  rawJson: CwaApiResponse,
  fetchedAt = new Date().toISOString()
): ForecastRecord[] {
  // 取得 location 陣列 (可能在 records.location 或 records.locations[].location)
  let locations = rawJson.records?.location ?? [];
  if (locations.length === 0 && rawJson.records?.locations) {
    for (const locGroup of rawJson.records.locations) {
      if (locGroup.location && locGroup.location.length > 0) {
        locations = locations.concat(locGroup.location);
      }
    }
  }

  // 建立以 (regionName + dataDate + startTime + endTime) 為 key 的暫存 Map
  type CompositeRecord = {
    regionName: TaiwanRegion;
    dataDate: string;
    startTime: string | null;
    endTime: string | null;
    minT: number | null;
    maxT: number | null;
    weather: string | null;
    weatherCode: string | null;
    pop: number | null;
    comfort: string | null;
  };

  const recordsMap = new Map<string, CompositeRecord>();

  for (const loc of locations) {
    const region = mapToStandardRegion(loc.locationName);
    if (!region) continue; // 僅處理白名單六大區域

    for (const elem of loc.weatherElement ?? []) {
      const elemName = elem.elementName.trim().toUpperCase();

      for (const t of elem.time ?? []) {
        const startTime = t.startTime ?? t.dataTime ?? "";
        const endTime = t.endTime ?? t.dataTime ?? "";
        const dataDate = extractDateString(startTime || endTime);

        // 使用 region + dataDate 作為基礎 key (或包含時段)
        // 為了將 7 天預報整合成每日預報，以 region + dataDate 為主聚合
        const key = `${region}_${dataDate}`;

        let entry = recordsMap.get(key);
        if (!entry) {
          entry = {
            regionName: region,
            dataDate,
            startTime: startTime || null,
            endTime: endTime || null,
            minT: null,
            maxT: null,
            weather: null,
            weatherCode: null,
            pop: null,
            comfort: null,
          };
          recordsMap.set(key, entry);
        }

        const { primary, secondary } = extractValue(t.elementValue, t.parameter);

        // 依據元素名稱解析對應欄位
        if (elemName === "MINT") {
          const val = safeParseFloat(primary);
          if (val !== null) {
            entry.minT = entry.minT === null ? val : Math.min(entry.minT, val);
          }
        } else if (elemName === "MAXT") {
          const val = safeParseFloat(primary);
          if (val !== null) {
            entry.maxT = entry.maxT === null ? val : Math.max(entry.maxT, val);
          }
        } else if (elemName === "WX") {
          if (primary && !entry.weather) entry.weather = primary;
          if (secondary && !entry.weatherCode) entry.weatherCode = secondary;
        } else if (elemName === "POP" || elemName === "POP12H") {
          const popVal = safeParseFloat(primary);
          if (popVal !== null && entry.pop === null) {
            entry.pop = popVal;
          }
        } else if (elemName === "CI") {
          if (primary && !entry.comfort) entry.comfort = primary;
        }
      }
    }
  }

  // 轉換為最終 ForecastRecord 清單並計算 avgT
  const results: ForecastRecord[] = [];
  for (const entry of Array.from(recordsMap.values())) {
    const avgT = calculateAverageTemperature(entry.minT, entry.maxT);
    results.push({
      regionName: entry.regionName,
      dataDate: entry.dataDate,
      startTime: entry.startTime,
      endTime: entry.endTime,
      minT: entry.minT,
      maxT: entry.maxT,
      avgT,
      weather: entry.weather ?? "多雲時晴",
      weatherCode: entry.weatherCode ?? "02",
      pop: entry.pop,
      comfort: entry.comfort ?? (avgT && avgT > 28 ? "舒適至悶熱" : "舒適"),
      fetchedAt,
    });
  }

  // 依日期與區域排序
  results.sort((a, b) => {
    if (a.dataDate !== b.dataDate) {
      return a.dataDate.localeCompare(b.dataDate);
    }
    return a.regionName.localeCompare(b.regionName);
  });

  return results;
}
