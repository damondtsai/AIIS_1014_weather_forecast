"use client";

import React from "react";
import { ForecastRecord } from "@/lib/types";
import { Calendar, Clock } from "lucide-react";

interface ForecastTableProps {
  records: ForecastRecord[];
  region: string;
}

export const ForecastTable: React.FC<ForecastTableProps> = ({ records, region }) => {
  const getWeekday = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      return weekdays[date.getDay()];
    } catch {
      return "—";
    }
  };

  const latestFetchedAt = records[0]?.fetchedAt || null;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-5 bg-blue-600 rounded-xs inline-block" />
            七日預報詳細資料表－{region}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">每日高低溫、平均溫、降雨機率與舒適度一覽</p>
        </div>
        {latestFetchedAt && (
          <div className="text-xs text-slate-400 flex items-center gap-1 self-start sm:self-auto bg-slate-50 border border-slate-100 rounded-md px-2.5 py-1">
            <Clock className="w-3 h-3 text-slate-400" />
            擷取時間：{new Date(latestFetchedAt).toLocaleString("zh-TW")}
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold">
              <th className="py-3 px-3.5 whitespace-nowrap">Date (日期)</th>
              <th className="py-3 px-3.5 whitespace-nowrap">星期</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Weather (天氣)</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-right">MinT (最低溫)</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-right">MaxT (最高溫)</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-right">AvgT (平均溫)</th>
              <th className="py-3 px-3.5 whitespace-nowrap text-right">PoP (降雨機率)</th>
              <th className="py-3 px-3.5 whitespace-nowrap">Comfort (舒適度)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  暫無七日預報詳細資料
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr
                  key={`${r.regionName}-${r.dataDate}`}
                  className="hover:bg-blue-50/40 transition-colors"
                >
                  <td className="py-3 px-3.5 font-medium text-slate-800 whitespace-nowrap flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    {r.dataDate}
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                    {getWeekday(r.dataDate)}
                  </td>
                  <td className="py-3 px-3.5 text-slate-800 whitespace-nowrap font-medium">
                    {r.weather || "暫無資料"}
                  </td>
                  <td className="py-3 px-3.5 text-right font-semibold text-blue-600 whitespace-nowrap">
                    {r.minT !== null && r.minT !== undefined ? `${r.minT} °C` : "—"}
                  </td>
                  <td className="py-3 px-3.5 text-right font-semibold text-red-600 whitespace-nowrap">
                    {r.maxT !== null && r.maxT !== undefined ? `${r.maxT} °C` : "—"}
                  </td>
                  <td className="py-3 px-3.5 text-right font-semibold text-amber-600 whitespace-nowrap">
                    {r.avgT !== null && r.avgT !== undefined ? `${r.avgT} °C` : "—"}
                  </td>
                  <td className="py-3 px-3.5 text-right text-slate-700 whitespace-nowrap">
                    {r.pop !== null && r.pop !== undefined ? `${r.pop} %` : "—"}
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                    {r.comfort || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
