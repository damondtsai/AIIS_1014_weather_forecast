import { z } from "zod";

// CWA 時間段元素值結構 (支援 elementValue 陣列或單一物件)
const CwaElementValueSchema = z.object({
  value: z.string().optional(),
  measures: z.string().optional(),
  parameterName: z.string().optional(),
  parameterValue: z.string().optional(),
  parameterUnit: z.string().optional(),
}).passthrough();

// 支援 CWA 兩種常見的結構 (elementValue 或 parameter)
const CwaTimeItemSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  dataTime: z.string().optional(),
  elementValue: z.array(CwaElementValueSchema).optional(),
  parameter: CwaElementValueSchema.optional(),
}).passthrough();

const CwaWeatherElementSchema = z.object({
  elementName: z.string(),
  description: z.string().optional(),
  time: z.array(CwaTimeItemSchema).default([]),
}).passthrough();

const CwaLocationSchema = z.object({
  locationName: z.string(),
  geocode: z.string().optional(),
  lat: z.string().optional(),
  lon: z.string().optional(),
  weatherElement: z.array(CwaWeatherElementSchema).default([]),
}).passthrough();

const CwaLocationsGroupSchema = z.object({
  datasetDescription: z.string().optional(),
  locationsName: z.string().optional(),
  location: z.array(CwaLocationSchema).default([]),
}).passthrough();

export const CwaApiResponseSchema = z.object({
  success: z.union([z.string(), z.boolean()]).optional(),
  result: z.record(z.unknown()).optional(),
  records: z.object({
    datasetDescription: z.string().optional(),
    locations: z.array(CwaLocationsGroupSchema).optional(),
    location: z.array(CwaLocationSchema).optional(),
  }).passthrough(),
}).passthrough();

export type CwaApiResponse = z.infer<typeof CwaApiResponseSchema>;
export type CwaLocation = z.infer<typeof CwaLocationSchema>;
export type CwaWeatherElement = z.infer<typeof CwaWeatherElementSchema>;
export type CwaTimeItem = z.infer<typeof CwaTimeItemSchema>;
