import React from "react";

export const TemperatureLegend: React.FC<{ className?: string }> = ({ className = "" }) => {
  const items = [
    { label: "< 20°C 涼爽", color: "bg-blue-500", text: "text-blue-700" },
    { label: "20–25°C 舒適", color: "bg-emerald-500", text: "text-emerald-700" },
    { label: "25–30°C 暖熱", color: "bg-yellow-500", text: "text-yellow-700" },
    { label: "> 30°C 炎熱", color: "bg-red-500", text: "text-red-700" },
    { label: "暫無資料", color: "bg-gray-400", text: "text-gray-600" },
  ];

  return (
    <div
      className={`bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-lg p-2.5 shadow-sm ${className}`}
      aria-label="溫度區間圖例"
    >
      <div className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
        <span>🌡️ 平均溫度圖例</span>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 text-xs">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className={`w-3 h-3 rounded-full ${item.color} shadow-xs inline-block`}
              aria-hidden="true"
            />
            <span className={`font-medium ${item.text}`}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
