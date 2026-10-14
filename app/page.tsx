import { Suspense } from "react";
import { WeatherDashboard } from "@/components/WeatherDashboard";

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-lg font-bold text-slate-800">載入氣象資料儀表板中...</h2>
          <p className="text-xs text-slate-500 mt-1">Taiwan Weather Forecast 台灣七天天氣預報</p>
        </div>
      }
    >
      <WeatherDashboard />
    </Suspense>
  );
}
