"use client";

import React from "react";
import { TAIWAN_REGIONS, TaiwanRegion } from "@/lib/regions";
import { RefreshCw, RotateCcw, MapPin, Calendar } from "lucide-react";

interface WeatherFiltersProps {
  selectedRegion: string;
  onRegionChange: (region: TaiwanRegion) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
  onRefresh: () => void;
  onReset: () => void;
  isLoading: boolean;
}

export const WeatherFilters: React.FC<WeatherFiltersProps> = ({
  selectedRegion,
  onRegionChange,
  selectedDate,
  onDateChange,
  availableDates,
  onRefresh,
  onReset,
  isLoading,
}) => {
  // 格式化日期與星期 (例: 2026-10-14 (週三))
  const formatDateLabel = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      const weekdays = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
      return `${dateStr} (${weekdays[d.getDay()]})`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 sm:p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 左側選單：區域與日期選擇 */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1">
          {/* 區域下拉選單 */}
          <div className="flex items-center gap-2 min-w-[200px]">
            <label
              htmlFor="region-select"
              className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap"
            >
              <MapPin className="w-4 h-4 text-blue-600" />
              預報區域
            </label>
            <select
              id="region-select"
              value={selectedRegion}
              onChange={(e) => onRegionChange(e.target.value as TaiwanRegion)}
              className="w-full text-sm font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs"
            >
              {TAIWAN_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          {/* 日期選擇器 */}
          <div className="flex items-center gap-2 min-w-[220px]">
            <label
              htmlFor="date-select"
              className="text-xs sm:text-sm font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 text-blue-600" />
              觀測日期
            </label>
            <select
              id="date-select"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="w-full text-sm font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-2xs"
            >
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {formatDateLabel(date)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 右側按鈕：更新資料與清除重設 */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg px-3.5 py-2 transition-all"
            title="重設為預設中部地區及起始日期"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            重設篩選
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg px-4 py-2 shadow-xs transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "同步中..." : "更新預報"}
          </button>
        </div>
      </div>
    </div>
  );
};
