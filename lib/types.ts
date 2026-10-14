export interface ForecastRecord {
  id?: number;
  regionName: string;
  dataDate: string; // YYYY-MM-DD
  startTime: string | null;
  endTime: string | null;
  minT: number | null;
  maxT: number | null;
  avgT: number | null;
  weather: string | null;
  weatherCode: string | null;
  pop: number | null;
  comfort: string | null;
  fetchedAt: string;
}

export interface WeatherApiResponse {
  ok: boolean;
  data?: ForecastRecord[];
  updatedAt?: string;
  error?: string;
}

export interface SyncApiResponse {
  ok: boolean;
  inserted?: number;
  updated?: number;
  total?: number;
  error?: string;
  source?: string;
}

export interface HealthApiResponse {
  ok: boolean;
  status: string;
  database: string;
  count: number;
  updatedAt: string | null;
  error?: string;
}

export interface RegionCoordinate {
  name: string;
  lat: number;
  lng: number;
  description: string;
}
