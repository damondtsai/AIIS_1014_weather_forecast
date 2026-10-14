"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import { ForecastRecord } from "@/lib/types";
import { REGION_COORDINATES, getTemperatureColor } from "@/lib/region-coordinates";
import { TAIWAN_REGIONS, TaiwanRegion } from "@/lib/regions";
import { TemperatureLegend } from "./TemperatureLegend";
import { MapPin } from "lucide-react";

interface TaiwanWeatherMapProps {
  recordsByRegion: Record<string, ForecastRecord | undefined>;
  selectedRegion: string;
  onSelectRegion: (region: TaiwanRegion) => void;
  selectedDate: string;
}

export const TaiwanWeatherMap: React.FC<TaiwanWeatherMapProps> = ({
  recordsByRegion,
  selectedRegion,
  onSelectRegion,
  selectedDate,
}) => {
  // 建立自訂圓形溫度 Marker 樣式
  const createCustomIcon = (regionName: string, avgT: number | null | undefined, isSelected: boolean) => {
    const color = getTemperatureColor(avgT);
    const tempText = avgT !== null && avgT !== undefined && !Number.isNaN(avgT) ? `${avgT}°` : "—";
    const ringClass = isSelected ? "ring-4 ring-offset-2 ring-blue-600 scale-110" : "";

    const html = `
      <div style="background-color: ${color};" class="custom-weather-pin w-10 h-10 ${ringClass}">
        <span>${tempText}</span>
      </div>
    `;

    return L.divIcon({
      html,
      className: "weather-pin-container",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22],
    });
  };

  // 台灣地理中心座標設定
  const taiwanCenter: [number, number] = [23.7, 120.95];

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-4 sm:p-6 flex flex-col h-[520px]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-5 bg-blue-600 rounded-xs inline-block" />
            台灣 GIS 氣溫分佈地圖
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            點擊地圖上的各區標記可同步切換預報；當前觀測日期：
            <span className="font-semibold text-blue-600 ml-1">{selectedDate || "全部"}</span>
          </p>
        </div>
        <TemperatureLegend className="self-start sm:self-auto" />
      </div>

      <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-200 shadow-inner">
        <MapContainer
          center={taiwanCenter}
          zoom={7}
          minZoom={6}
          maxZoom={12}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {TAIWAN_REGIONS.map((regionName) => {
            const coord = REGION_COORDINATES[regionName];
            if (!coord) return null;

            const record = recordsByRegion[regionName];
            const avgT = record?.avgT;
            const isSelected = selectedRegion === regionName;
            const icon = createCustomIcon(regionName, avgT, isSelected);

            return (
              <Marker
                key={regionName}
                position={[coord.lat, coord.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    onSelectRegion(regionName);
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -20]} opacity={0.95}>
                  <div className="text-xs font-semibold px-1 py-0.5">
                    {regionName}：{avgT !== null && avgT !== undefined ? `${avgT} °C` : "暫無資料"}
                  </div>
                </Tooltip>

                <Popup>
                  <div className="p-1 text-slate-800 text-xs min-w-[170px]">
                    <div className="font-bold text-sm text-blue-800 pb-1 border-b border-slate-200 flex items-center justify-between">
                      <span>{regionName}</span>
                      <span className="text-xs font-normal text-slate-500">
                        {record?.dataDate || selectedDate}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">天氣狀況:</span>
                        <span className="font-medium text-slate-900">{record?.weather || "暫無資料"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">平均氣溫:</span>
                        <span className="font-bold text-amber-600">
                          {record?.avgT !== null && record?.avgT !== undefined ? `${record.avgT} °C` : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">氣溫範圍:</span>
                        <span className="text-slate-700">
                          {record?.minT ?? "—"}°C ~ {record?.maxT ?? "—"}°C
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">降雨機率:</span>
                        <span className="text-blue-600 font-medium">
                          {record?.pop !== null && record?.pop !== undefined ? `${record.pop} %` : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">涵蓋縣市:</span>
                        <span className="text-slate-500 text-[10px] text-right max-w-[110px] truncate" title={coord.description}>
                          {coord.description}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectRegion(regionName)}
                      className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-2 rounded-md text-center text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      鎖定此區域圖表
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
