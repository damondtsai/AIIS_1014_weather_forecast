import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taiwan Weather Forecast 台灣七天天氣預報",
  description: "從氣象資料到互動式天氣預報應用 - 中央氣象署 (CWA) 七天天氣預報儀表板與 GIS 溫度地圖",
  keywords: ["Taiwan Weather", "台灣天氣預報", "CWA", "中央氣象署", "氣溫圖表", "GIS地圖"],
  authors: [{ name: "Taiwan Weather Forecast Team" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className="antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
