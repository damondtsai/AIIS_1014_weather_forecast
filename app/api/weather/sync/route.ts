import { NextRequest, NextResponse } from "next/server";
import { fetchCwaWeatherData } from "@/lib/cwa/client";
import { upsertForecasts } from "@/lib/db/repository";
import { SyncApiResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

let lastSyncTimestamp = 0;
const MIN_SYNC_INTERVAL_MS = 30 * 1000; // 最低間隔 30 秒，防止短時間重複大量請求

export async function POST(request: NextRequest): Promise<NextResponse<SyncApiResponse>> {
  try {
    // 1. 安全檢查：驗證 Authorization Header
    const expectedSecret = process.env.SYNC_SECRET?.trim();
    const authHeader = request.headers.get("authorization");

    // 若設定了 SYNC_SECRET，必須完全吻合 Bearer Token；若未設定則要求基本授權標頭以防濫用
    if (!authHeader || (expectedSecret && authHeader !== `Bearer ${expectedSecret}`)) {
      return NextResponse.json(
        {
          ok: false,
          error: "未經授權的同步請求：缺少或不正確的 Bearer 授權憑證。",
        },
        { status: 401 }
      );
    }

    // 2. 防範短時間重複同步
    const now = Date.now();
    if (now - lastSyncTimestamp < MIN_SYNC_INTERVAL_MS) {
      return NextResponse.json(
        {
          ok: false,
          error: "資料甫於 30 秒內完成同步，請稍候再試以保護氣象署伺服器配額。",
        },
        { status: 429 }
      );
    }

    // 3. 取得 CWA 氣象資料並經 Zod 與正規化驗證
    const { records, source, warning } = await fetchCwaWeatherData();

    if (!records || records.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          error: "未取得任何有效的氣象預報資料，資料庫未進行變更。",
        },
        { status: 422 }
      );
    }

    // 4. UPSERT 寫入資料庫
    const result = await upsertForecasts(records);
    lastSyncTimestamp = Date.now();

    return NextResponse.json({
      ok: true,
      inserted: result.inserted,
      updated: result.updated,
      total: result.total,
      source,
      error: warning,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "未知錯誤";
    console.error("[Weather Sync Error]:", message);
    return NextResponse.json(
      {
        ok: false,
        error: `氣象資料同步失敗：${message}`,
      },
      { status: 500 }
    );
  }
}
