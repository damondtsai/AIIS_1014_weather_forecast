import { NextRequest, NextResponse } from "next/server";
import { getForecasts, getLatestFetchedAt, getForecastCount, upsertForecasts } from "@/lib/db/repository";
import { isValidRegion } from "@/lib/regions";
import { fetchCwaWeatherData } from "@/lib/cwa/client";
import { WeatherApiResponse, ForecastRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse<WeatherApiResponse>> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const regionParam = searchParams.get("region")?.trim();
    const dateParam = searchParams.get("date")?.trim();

    // 驗證六大區域白名單
    if (regionParam && !isValidRegion(regionParam)) {
      return NextResponse.json(
        {
          ok: false,
          error: `指定的區域「${regionParam}」不存在，請由「北部地區、中部地區、南部地區、東北部地區、東部地區、東南部地區」中選擇。`,
        },
        { status: 400 }
      );
    }

    let data: ForecastRecord[] = [];
    let updatedAt = new Date().toISOString();

    try {
      // 若資料庫尚未有足夠的六大區域記錄，主動進行自動預熱種子同步
      const count = await getForecastCount();
      if (count < 6) {
        try {
          console.log("[Weather API] 資料庫尚無完整預報紀錄，正在執行自動預熱同步...");
          const syncRes = await fetchCwaWeatherData();
          if (syncRes.records.length > 0) {
            await upsertForecasts(syncRes.records);
          }
        } catch (syncErr) {
          console.warn("[Weather API] 預熱同步失敗，將嘗試以既有資料呈現:", syncErr);
        }
      }

      data = await getForecasts({
        region: regionParam || undefined,
        date: dateParam || undefined,
      });

      updatedAt = (await getLatestFetchedAt()) || new Date().toISOString();
    } catch (dbErr) {
      console.warn("[Weather API] 資料庫存取異常，安全切換為記憶體備援預報資料:", dbErr);
      const fallback = await fetchCwaWeatherData();
      data = fallback.records;
      if (regionParam) {
        data = data.filter((r) => r.regionName === regionParam);
      }
      if (dateParam) {
        data = data.filter((r) => r.dataDate === dateParam);
      }
    }

    return NextResponse.json(
      {
        ok: true,
        data,
        updatedAt,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "伺服器內部發生未知錯誤";
    console.error("[Weather API Error]:", message);
    return NextResponse.json(
      {
        ok: false,
        error: `無法載入氣象資料：${message}`,
      },
      { status: 500 }
    );
  }
}
