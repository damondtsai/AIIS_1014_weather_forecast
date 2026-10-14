"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { ForecastRecord, WeatherApiResponse } from "@/lib/types";
import { TAIWAN_REGIONS, TaiwanRegion, DEFAULT_REGION, isValidRegion } from "@/lib/regions";
import { WeatherFilters } from "./WeatherFilters";
import { WeatherSummaryCards } from "./WeatherSummaryCards";
import { TemperatureChart } from "./TemperatureChart";
import { ForecastTable } from "./ForecastTable";
import {
  Sun,
  CloudSun,
  Database,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Info,
} from "lucide-react";

// 動態載入 Leaflet 地圖，設定 ssr: false 防止 "window is not defined"
const DynamicTaiwanWeatherMap = dynamic(
  () => import("./TaiwanWeatherMap").then((mod) => mod.TaiwanWeatherMap),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-6 flex flex-col items-center justify-center h-[520px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-3" />
        <p className="text-sm text-slate-500 font-medium">台灣 GIS 地圖模組載入中...</p>
      </div>
    ),
  }
);

export const WeatherDashboard: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 從 URL Search Params 讀取初始篩選條件
  const initialRegion = searchParams.get("region");
  const initialDate = searchParams.get("date");

  const [selectedRegion, setSelectedRegion] = useState<TaiwanRegion>(() => {
    if (initialRegion && isValidRegion(initialRegion)) {
      return initialRegion;
    }
    return DEFAULT_REGION;
  });

  const [selectedDate, setSelectedDate] = useState<string>(initialDate || "");
  const [allRecords, setAllRecords] = useState<ForecastRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");

  // 同步 URL Search Params，保證重新整理後狀態得以完整保留
  const updateUrlParams = useCallback(
    (region: string, date: string) => {
      const params = new URLSearchParams();
      if (region) params.set("region", region);
      if (date) params.set("date", date);
      const queryStr = params.toString();
      router.replace(queryStr ? `?${queryStr}` : "/", { scroll: false });
    },
    [router]
  );

  // 取得完整天氣資料
  const fetchWeatherData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setErrorMessage(null);

      try {
        const res = await fetch("/api/weather", { cache: "no-store" });
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `HTTP 錯誤 ${res.status}`);
        }

        const data: WeatherApiResponse = await res.json();
        if (data.ok && Array.isArray(data.data)) {
          setAllRecords(data.data);
          setUpdatedAt(data.updatedAt || new Date().toISOString());

          // 如果尚未選擇日期，或選擇的日期不在清單中，預設選取第一筆有效日期
          const dates = Array.from(new Set(data.data.map((r) => r.dataDate))).sort();
          if (dates.length > 0) {
            setSelectedDate((prev) => {
              if (prev && dates.includes(prev)) return prev;
              return dates[0];
            });
          }
        } else {
          throw new Error(data.error || "回傳之氣象資料格式異常");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "無法載入氣象資料";
        setErrorMessage(msg);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  // 當使用者變更區域時
  const handleRegionChange = (region: TaiwanRegion) => {
    setSelectedRegion(region);
    updateUrlParams(region, selectedDate);
  };

  // 當使用者變更日期時
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    updateUrlParams(selectedRegion, date);
  };

  // 重設篩選器為預設值
  const handleResetFilters = () => {
    const dates = Array.from(new Set(allRecords.map((r) => r.dataDate))).sort();
    const firstDate = dates[0] || "";
    setSelectedRegion(DEFAULT_REGION);
    setSelectedDate(firstDate);
    updateUrlParams(DEFAULT_REGION, firstDate);
  };

  // 所有不重複的預報日期清單
  const availableDates = useMemo(() => {
    return Array.from(new Set(allRecords.map((r) => r.dataDate))).sort();
  }, [allRecords]);

  // 當前選取區域的七天預報資料 (供折線圖與預報表格使用)
  const regionRecords = useMemo(() => {
    return allRecords
      .filter((r) => r.regionName === selectedRegion)
      .sort((a, b) => a.dataDate.localeCompare(b.dataDate));
  }, [allRecords, selectedRegion]);

  // 當前選取區域與日期的單日預報資料 (供氣象摘要卡片使用)
  const currentRecord = useMemo(() => {
    return (
      regionRecords.find((r) => r.dataDate === selectedDate) ||
      regionRecords[0] ||
      null
    );
  }, [regionRecords, selectedDate]);

  // 當前日期下所有區域的最新一筆資料 (供地圖 Markers 使用)
  const mapRecordsByRegion = useMemo(() => {
    const map: Record<string, ForecastRecord | undefined> = {};
    for (const region of TAIWAN_REGIONS) {
      const match = allRecords.find(
        (r) => r.regionName === region && (!selectedDate || r.dataDate === selectedDate)
      );
      map[region] = match;
    }
    return map;
  }, [allRecords, selectedDate]);

  return (
    <div className="flex-1 flex flex-col">
      {/* 頁首 Header：深藍色、精緻漸層與天氣視覺 */}
      <header className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shadow-lg border-b border-blue-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* 標題與副標題 */}
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shadow-inner">
                <Sun className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                    Taiwan Weather Forecast
                  </h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-semibold">
                    台灣七天天氣預報
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200/80 mt-1">
                  從氣象資料到互動式天氣預報應用 (CWA Open Data F-A0010-001)
                </p>
              </div>
            </div>

            {/* 標籤、狀態與更新資訊 */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-blue-200">
              <div className="flex items-center gap-1.5 bg-blue-900/40 border border-blue-700/50 rounded-lg px-3 py-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>CWA Open Data</span>
              </div>
              <div className="flex items-center gap-1.5 bg-blue-900/40 border border-blue-700/50 rounded-lg px-3 py-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>LibSQL / SQLite</span>
              </div>
              {updatedAt && (
                <div className="text-blue-300/80 text-[11px] ml-1">
                  最後更新：{new Date(updatedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主要內容容器 */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* 提示訊息 Alert (若有) */}
        {noticeMessage && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800 text-sm">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">{noticeMessage}</div>
            <button
              type="button"
              onClick={() => setNoticeMessage(null)}
              className="text-amber-500 hover:text-amber-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* 錯誤警示 Alert */}
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">載入或同步資料時發生問題</div>
              <div className="text-xs text-red-700 mt-0.5">{errorMessage}</div>
            </div>
            <button
              type="button"
              onClick={() => fetchWeatherData(true)}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-medium"
            >
              重試
            </button>
          </div>
        )}

        {/* 篩選控制器 */}
        <WeatherFilters
          selectedRegion={selectedRegion}
          onRegionChange={handleRegionChange}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          availableDates={availableDates}
          onRefresh={() => fetchWeatherData(true)}
          onReset={handleResetFilters}
          isLoading={isRefreshing || isLoading}
        />

        {/* 天氣指標摘要卡片 */}
        <WeatherSummaryCards
          currentRecord={currentRecord}
          selectedRegion={selectedRegion}
          selectedDate={selectedDate}
        />

        {/* 核心圖表與 GIS 地圖排版 (桌機雙欄排版) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* 左欄：七日氣溫折線圖 */}
          <TemperatureChart records={regionRecords} region={selectedRegion} />

          {/* 右欄：台灣 GIS 氣溫分佈地圖 */}
          <DynamicTaiwanWeatherMap
            recordsByRegion={mapRecordsByRegion}
            selectedRegion={selectedRegion}
            onSelectRegion={handleRegionChange}
            selectedDate={selectedDate}
          />
        </div>

        {/* 下方：七日預報詳細資料表 */}
        <ForecastTable records={regionRecords} region={selectedRegion} />
      </main>

      {/* 頁尾 Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>
            Taiwan Weather Forecast 台灣七天天氣預報 © {new Date().getFullYear()}｜氣象資料來源：
            <a
              href="https://opendata.cwa.gov.tw/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-medium ml-1"
            >
              交通部中央氣象署開放資料平台 (CWA Open Data)
            </a>
          </p>
          <p className="text-slate-400">
            採用 Next.js App Router, TypeScript, LibSQL/SQLite, Recharts 及 Leaflet GIS 建置
          </p>
        </div>
      </footer>
    </div>
  );
};
