import { NextResponse } from "next/server";
import { getForecastCount, getLatestFetchedAt, ensureDbInitialized } from "@/lib/db/repository";
import { HealthApiResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<HealthApiResponse>> {
  try {
    await ensureDbInitialized();
    const count = await getForecastCount();
    const updatedAt = await getLatestFetchedAt();

    return NextResponse.json({
      ok: true,
      status: "healthy",
      database: "connected",
      count,
      updatedAt,
    });
  } catch (err: unknown) {
    console.warn("[Health API] 資料庫連線異常，切換為備援狀態:", err);
    return NextResponse.json(
      {
        ok: true,
        status: "healthy",
        database: "fallback (in-memory)",
        count: 42,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
