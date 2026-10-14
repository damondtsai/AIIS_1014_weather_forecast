import { RegionCoordinate } from "./types";
import { TaiwanRegion } from "./regions";

export const REGION_COORDINATES: Record<TaiwanRegion, RegionCoordinate> = {
  北部地區: {
    name: "北部地區",
    lat: 25.0478,
    lng: 121.5319,
    description: "基隆市、臺北市、新北市、桃園市、新竹市、新竹縣、苗栗縣",
  },
  中部地區: {
    name: "中部地區",
    lat: 24.1477,
    lng: 120.6736,
    description: "臺中市、彰化縣、南投縣、雲林縣、嘉義市、嘉義縣",
  },
  南部地區: {
    name: "南部地區",
    lat: 22.6273,
    lng: 120.3014,
    description: "臺南市、高雄市、屏東縣",
  },
  東北部地區: {
    name: "東北部地區",
    lat: 24.7570,
    lng: 121.7530,
    description: "宜蘭縣",
  },
  東部地區: {
    name: "東部地區",
    lat: 23.9912,
    lng: 121.6197,
    description: "花蓮縣",
  },
  東南部地區: {
    name: "東南部地區",
    lat: 22.7583,
    lng: 121.1444,
    description: "臺東縣",
  },
};

/**
 * 依據平均氣溫取得標記顏色
 * <20°C：藍色 (#3b82f6)
 * 20–25°C：綠色 (#10b981)
 * 25–30°C：黃色 (#eab308)
 * >30°C：紅色 (#ef4444)
 * 沒有資料：灰色 (#9ca3af)
 */
export function getTemperatureColor(avgT: number | null | undefined): string {
  if (avgT === null || avgT === undefined || Number.isNaN(avgT)) {
    return "#9ca3af"; // 灰色
  }
  if (avgT < 20) {
    return "#3b82f6"; // 藍色
  }
  if (avgT <= 25) {
    return "#10b981"; // 綠色
  }
  if (avgT <= 30) {
    return "#eab308"; // 黃色
  }
  return "#ef4444"; // 紅色
}

export function getTemperatureLabel(avgT: number | null | undefined): string {
  if (avgT === null || avgT === undefined || Number.isNaN(avgT)) {
    return "暫無資料";
  }
  if (avgT < 20) return "涼爽 (< 20°C)";
  if (avgT <= 25) return "舒適 (20–25°C)";
  if (avgT <= 30) return "暖熱 (25–30°C)";
  return "炎熱 (> 30°C)";
}
