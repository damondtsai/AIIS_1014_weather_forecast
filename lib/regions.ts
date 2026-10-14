export const TAIWAN_REGIONS = [
  "北部地區",
  "中部地區",
  "南部地區",
  "東北部地區",
  "東部地區",
  "東南部地區",
] as const;

export type TaiwanRegion = (typeof TAIWAN_REGIONS)[number];

export const DEFAULT_REGION: TaiwanRegion = "中部地區";

export function isValidRegion(region: string): region is TaiwanRegion {
  return TAIWAN_REGIONS.includes(region as TaiwanRegion);
}
