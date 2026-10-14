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
    const errorMsg = err instanceof Error ? err.message : "資料庫無法連線";
    return NextResponse.json(
      {
        ok: false,
        status: "unhealthy",
        database: "disconnected",
        count: 0,
        updatedAt: null,
        error: errorMsg,
      },
      { status: 503 }
    );
  }
}
