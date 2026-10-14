"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ForecastRecord } from "@/lib/types";

interface TemperatureChartProps {
  records: ForecastRecord[];
  region: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length > 0) {
    return (
      <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-3 text-xs">
        <p className="font-bold text-slate-800 mb-1.5">{label}</p>
        {payload.map((item) => (
          <div key={item.name} className="flex items-center gap-2 py-0.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-600 font-medium">{item.name}:</span>
            <span className="font-bold text-slate-900">{item.value} °C</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const TemperatureChart: React.FC<TemperatureChartProps> = ({ records, region }) => {
  // 轉換資料並格式化日期為 MM/DD
  const chartData = records.map((r) => {
    let dateLabel = r.dataDate;
    const parts = r.dataDate.split("-");
    if (parts.length === 3) {
      dateLabel = `${parts[1]}/${parts[2]}`;
    }
    return {
      date: dateLabel,
      fullDate: r.dataDate,
      MaxT: r.maxT,
      MinT: r.minT,
      AvgT: r.avgT,
    };
  });

  const hasData = chartData.some((d) => d.MaxT !== null || d.MinT !== null);

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 sm:p-6 flex flex-col h-[380px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-5 bg-blue-600 rounded-xs inline-block" />
          Temperature Forecast－{region}
        </h2>
        <span className="text-xs text-slate-500 font-medium">七日溫度變化曲線</span>
      </div>

      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <p className="text-sm font-medium">查無當前區域之氣溫折線圖資料</p>
          <p className="text-xs text-slate-400 mt-1">請嘗試點擊右上角「更新預報」或切換區域</p>
        </div>
      ) : (
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                unit="°C"
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: "#cbd5e1" }}
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: "10px", fontSize: "12px" }}
              />
              <Line
                type="monotone"
                dataKey="MaxT"
                name="MaxT (最高溫)"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#ef4444", strokeWidth: 1, stroke: "#ffffff" }}
                activeDot={{ r: 6, fill: "#dc2626" }}
              />
              <Line
                type="monotone"
                dataKey="MinT"
                name="MinT (最低溫)"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "#3b82f6", strokeWidth: 1, stroke: "#ffffff" }}
                activeDot={{ r: 6, fill: "#2563eb" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
