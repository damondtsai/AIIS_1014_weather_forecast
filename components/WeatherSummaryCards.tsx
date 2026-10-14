"use client";

import React from "react";
import { ForecastRecord } from "@/lib/types";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  Thermometer,
  Droplets,
  HeartHandshake,
  CalendarDays,
  MapPin,
} from "lucide-react";

interface WeatherSummaryCardsProps {
  currentRecord?: ForecastRecord | null;
  selectedRegion: string;
  selectedDate: string;
}

export const WeatherSummaryCards: React.FC<WeatherSummaryCardsProps> = ({
  currentRecord,
  selectedRegion,
  selectedDate,
}) => {
  // 依據天氣字串動態取得合適的天氣圖示
  const getWeatherIcon = (weatherText?: string | null) => {
    if (!weatherText) return <CloudSun className="w-8 h-8 text-amber-500" />;
    if (weatherText.includes("雨")) {
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    }
    if (weatherText.includes("晴")) {
      return <Sun className="w-8 h-8 text-amber-500" />;
    }
    if (weatherText.includes("陰")) {
      return <Cloud className="w-8 h-8 text-slate-500" />;
    }
    return <CloudSun className="w-8 h-8 text-amber-500" />;
  };

  const formatTemp = (val: number | null | undefined) => {
    if (val === null || val === undefined || Number.isNaN(val)) return "暫無資料";
    return `${val} °C`;
  };

  const formatPop = (val: number | null | undefined) => {
    if (val === null || val === undefined || Number.isNaN(val)) return "暫無資料";
    return `${val} %`;
  };

  const weatherDesc = currentRecord?.weather || "暫無資料";
  const comfortDesc = currentRecord?.comfort || "暫無資料";

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {/* 區域與日期 */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">觀測區域 / 日期</span>
          <MapPin className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-lg font-bold text-slate-800 tracking-tight">
          {selectedRegion}
        </div>
        <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {selectedDate || "暫無資料"}
        </div>
      </div>

      {/* 天氣概況與圖示 */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">天氣狀況</span>
          {getWeatherIcon(currentRecord?.weather)}
        </div>
        <div className="text-lg font-bold text-slate-800 tracking-tight">
          {weatherDesc}
        </div>
        <div className="text-xs font-medium text-slate-500 mt-1">
          代碼：{currentRecord?.weatherCode || "—"}
        </div>
      </div>

      {/* 氣溫區間 (最低/最高/平均溫) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">氣溫指標</span>
          <Thermometer className="w-4 h-4 text-red-500" />
        </div>
        <div className="text-lg font-bold text-slate-800">
          <span className="text-amber-600">{formatTemp(currentRecord?.avgT)}</span>
          <span className="text-xs text-slate-500 font-normal ml-1">(平均)</span>
        </div>
        <div className="text-xs font-medium text-slate-600 mt-1 flex items-center gap-2">
          <span className="text-blue-600">低 {formatTemp(currentRecord?.minT)}</span>
          <span className="text-slate-300">|</span>
          <span className="text-red-600">高 {formatTemp(currentRecord?.maxT)}</span>
        </div>
      </div>

      {/* 降雨機率與舒適度 */}
      <div className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-medium">降雨機率 / 舒適度</span>
          <Droplets className="w-4 h-4 text-blue-500" />
        </div>
        <div className="text-lg font-bold text-blue-600">
          {formatPop(currentRecord?.pop)}
        </div>
        <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1">
          <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
          {comfortDesc}
        </div>
      </div>
    </div>
  );
};
