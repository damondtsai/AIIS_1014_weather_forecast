import { describe, it, expect, beforeEach } from "vitest";
import {
  mapToStandardRegion,
  safeParseFloat,
  calculateAverageTemperature,
  normalizeCwaForecasts,
} from "@/lib/cwa/normalize";
import { TAIWAN_REGIONS, isValidRegion } from "@/lib/regions";
import { CwaApiResponse } from "@/lib/cwa/schema";
import { upsertForecasts, getForecasts } from "@/lib/db/repository";
import { NextRequest } from "next/server";
import { GET as weatherGetHandler } from "@/app/api/weather/route";
import { POST as syncPostHandler } from "@/app/api/weather/sync/route";
import React from "react";
import { render, screen } from "@testing-library/react";
import { TemperatureChart } from "@/components/TemperatureChart";

// 測試用基礎 Mock CWA 資料
const sampleCwaJson: CwaApiResponse = {
  records: {
    locations: [
      {
        location: [
          {
            locationName: "北部地區",
            weatherElement: [
              {
                elementName: "MinT",
                time: [
                  {
                    startTime: "2026-10-15 00:00:00",
                    endTime: "2026-10-15 12:00:00",
                    elementValue: [{ value: "22.5" }],
                  },
                ],
              },
              {
                elementName: "MaxT",
                time: [
                  {
                    startTime: "2026-10-15 00:00:00",
                    endTime: "2026-10-15 12:00:00",
                    elementValue: [{ value: "28.5" }],
                  },
                ],
              },
              {
                elementName: "Wx",
                time: [
                  {
                    startTime: "2026-10-15 00:00:00",
                    endTime: "2026-10-15 12:00:00",
                    elementValue: [{ value: "晴時多雲" }, { value: "02" }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
};

describe("台灣氣象預報系統 (Taiwan Weather Forecast) 12 項規格測試", () => {
  // 1. CWA JSON 解析測試
  it("1. 應正確解析 CWA JSON 並產生正規化預報記錄", () => {
    const records = normalizeCwaForecasts(sampleCwaJson);
    expect(records.length).toBeGreaterThan(0);
    const item = records[0];
    expect(item.regionName).toBe("北部地區");
    expect(item.dataDate).toBe("2026-10-15");
    expect(item.minT).toBe(22.5);
    expect(item.maxT).toBe(28.5);
    expect(item.avgT).toBe(25.5);
    expect(item.weather).toBe("晴時多雲");
  });

  // 2. MinT／MaxT 轉換測試
  it("2. 應安全將字串型別之 MinT 與 MaxT 轉換為浮點數", () => {
    expect(safeParseFloat("24.8")).toBe(24.8);
    expect(safeParseFloat(" 19 ")).toBe(19);
    expect(safeParseFloat(30.2)).toBe(30.2);
  });

  // 3. 缺少 weatherElement 容錯測試
  it("3. 面對缺少 weatherElement 之地點，應優雅容錯不拋出例外", () => {
    const incompleteJson: CwaApiResponse = {
      records: {
        location: [
          {
            locationName: "中部地區",
            weatherElement: [],
          },
        ],
      },
    };
    const records = normalizeCwaForecasts(incompleteJson);
    expect(Array.isArray(records)).toBe(true);
    expect(records.length).toBe(0);
  });

  // 4. 無效溫度測試
  it("4. 面對無效或無法轉換之非數值溫度字串，應回傳 null", () => {
    expect(safeParseFloat("N/A")).toBeNull();
    expect(safeParseFloat("")).toBeNull();
    expect(safeParseFloat(undefined)).toBeNull();
    expect(safeParseFloat(null)).toBeNull();
  });

  // 5. 六大區域白名單測試
  it("5. 僅允許六大指定區域通過白名單驗證，其餘無效區域應予以拒絕", () => {
    for (const region of TAIWAN_REGIONS) {
      expect(isValidRegion(region)).toBe(true);
      expect(mapToStandardRegion(region)).toBe(region);
    }
    expect(isValidRegion("火星地區")).toBe(false);
    expect(mapToStandardRegion("無效地區")).toBeNull();
  });

  // 6. 平均溫度計算測試
  it("6. 應依公式 avgT = (minT + maxT) / 2 正確計算平均溫度", () => {
    expect(calculateAverageTemperature(20, 30)).toBe(25);
    expect(calculateAverageTemperature(21.4, 29.8)).toBe(25.6);
    expect(calculateAverageTemperature(null, 28)).toBeNull();
    expect(calculateAverageTemperature(22, null)).toBeNull();
  });

  // 7. UPSERT 不重複測試
  it("7. 重複寫入相同區域與時段之預報時，UPSERT 應更新而不重複插入", async () => {
    const dummyRecord = {
      regionName: "中部地區",
      dataDate: "2026-10-15",
      startTime: "2026-10-15 00:00:00",
      endTime: "2026-10-15 12:00:00",
      minT: 22,
      maxT: 30,
      avgT: 26,
      weather: "晴天",
      weatherCode: "01",
      pop: 10,
      comfort: "舒適",
      fetchedAt: new Date().toISOString(),
    };

    // 第一次插入
    const res1 = await upsertForecasts([dummyRecord]);
    expect(res1.total).toBe(1);

    // 第二次插入相同鍵值 (僅溫度更新)
    const updatedRecord = { ...dummyRecord, minT: 23, maxT: 31, avgT: 27 };
    const res2 = await upsertForecasts([updatedRecord]);
    expect(res2.total).toBe(1);

    // 驗證資料庫筆數未因重複寫入而膨脹
    const records = await getForecasts({ region: "中部地區", date: "2026-10-15" });
    const matched = records.filter(
      (r) => r.startTime === dummyRecord.startTime && r.endTime === dummyRecord.endTime
    );
    expect(matched.length).toBe(1);
    expect(matched[0].avgT).toBe(27);
  });

  // 8. 無效 region API 測試
  it("8. 傳入無效 region 查詢參數時，API 應回傳 HTTP 400 錯誤訊息", async () => {
    const req = new NextRequest("http://localhost:3000/api/weather?region=UnknownRegion");
    const res = await weatherGetHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toContain("不存在");
  });

  // 9. 無資料 API 測試
  it("9. 當指定日期查無任何氣象預報時，應回傳空資料陣列而非崩潰", async () => {
    const req = new NextRequest("http://localhost:3000/api/weather?date=1990-01-01");
    const res = await weatherGetHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.data).toEqual([]);
  });

  // 10. 同步 API 未授權測試
  it("10. 呼叫 POST /api/weather/sync 未提供正確 Authorization 時，應回傳 HTTP 401", async () => {
    const reqWithoutAuth = new NextRequest("http://localhost:3000/api/weather/sync", {
      method: "POST",
    });
    const res = await syncPostHandler(reqWithoutAuth);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.error).toContain("未經授權");
  });

  // 11. 日期篩選測試
  it("11. 依指定日期篩選 Repository 時，應僅精確回傳該日之預報資料", async () => {
    const targetDate = "2026-10-16";
    const record = {
      regionName: "南部地區",
      dataDate: targetDate,
      startTime: "2026-10-16 00:00:00",
      endTime: "2026-10-16 12:00:00",
      minT: 24,
      maxT: 32,
      avgT: 28,
      weather: "晴時多雲",
      weatherCode: "02",
      pop: 10,
      comfort: "悶熱",
      fetchedAt: new Date().toISOString(),
    };
    await upsertForecasts([record]);

    const results = await getForecasts({ date: targetDate });
    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(r.dataDate).toBe(targetDate);
    }
  });

  // 12. 圖表空資料測試
  it("12. 當無預報資料時，折線圖元件應正確顯示空狀態提示而非發生錯誤", () => {
    render(<TemperatureChart records={[]} region="東部地區" />);
    expect(screen.getByText(/查無當前區域之氣溫折線圖資料/i)).toBeDefined();
    expect(screen.getByText(/Temperature Forecast－東部地區/i)).toBeDefined();
  });
});
