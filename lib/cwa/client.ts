import fs from "fs";
import path from "path";
import { CwaApiResponse, CwaApiResponseSchema } from "./schema";
import { normalizeCwaForecasts } from "./normalize";
import { ForecastRecord } from "../types";

export interface FetchCwaResult {
  records: ForecastRecord[];
  source: "live" | "mock";
  warning?: string;
}

/**
 * 伺服器端呼叫中央氣象署 (CWA) Open Data API
 * 嚴禁外洩 API Key，若未設定或連線異常則提供詳細中文說明與離線資料備援
 */
export async function fetchCwaWeatherData(): Promise<FetchCwaResult> {
  const apiKey = process.env.CWA_API_KEY?.trim();
  const datasetId = process.env.CWA_DATASET_ID?.trim() || "F-A0010-001";

  // 若未設定 API Key，載入離線 Mock 資料並提示設定
  if (!apiKey) {
    console.warn(
      "[CWA Client] 未設定 CWA_API_KEY 環境變數，已安全切換為離線示範資料 (public/mock/cwa-weather.json)"
    );
    const mockData = loadOfflineMockData();
    const records = normalizeCwaForecasts(mockData);
    return {
      records,
      source: "mock",
      warning: "未設定 CWA_API_KEY，目前顯示離線示範預報資料。請於 .env.local 或 Vercel 環境變數填寫 CWA 授權碼以啟用即時同步。",
    };
  }

  const endpoint = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/${encodeURIComponent(datasetId)}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 秒超時

    // 使用 URL 物件安全傳遞 Authorization，避免在 Server Log 輸出完整含有授權碼的網址
    const url = new URL(endpoint);
    url.searchParams.set("Authorization", apiKey);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      let errorMsg = `CWA API 伺服器回應錯誤 (HTTP ${status})`;
      if (status === 401 || status === 403) {
        errorMsg = "CWA API 授權失敗，請確認 CWA_API_KEY 是否正確有效。";
      } else if (status === 404) {
        errorMsg = `查無指定的氣象資料集 (${datasetId})。`;
      }
      throw new Error(errorMsg);
    }

    const json = await response.json();
    const parseResult = CwaApiResponseSchema.safeParse(json);

    if (!parseResult.success) {
      console.error("[CWA Client] CWA JSON 驗證失敗:", parseResult.error.format());
      throw new Error("CWA API 回傳之 JSON 格式與規範不符。");
    }

    const records = normalizeCwaForecasts(parseResult.data);
    if (records.length === 0) {
      throw new Error("CWA API 資料解析結果為空，無法取得有效預報。");
    }

    return {
      records,
      source: "live",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "未知錯誤";
    console.error("[CWA Client] 連線或解析 CWA 發生錯誤:", errorMsg);

    // 嘗試從離線 Mock 資料降級備援
    try {
      const mockData = loadOfflineMockData();
      const records = normalizeCwaForecasts(mockData);
      return {
        records,
        source: "mock",
        warning: `CWA 即時同步連線失敗 (${errorMsg})，已安全自動降級使用本地示範預報資料。`,
      };
    } catch {
      throw new Error(`無法從 CWA 取得氣象資料且離線備援不可用: ${errorMsg}`);
    }
  }
}

/**
 * 讀取本機離線示範資料
 */
export function loadOfflineMockData(): CwaApiResponse {
  const mockPath = path.join(process.cwd(), "public", "mock", "cwa-weather.json");
  if (!fs.existsSync(mockPath)) {
    throw new Error(`找不到離線備援檔案: ${mockPath}`);
  }
  const content = fs.readFileSync(mockPath, "utf-8");
  const json = JSON.parse(content);
  return CwaApiResponseSchema.parse(json);
}
