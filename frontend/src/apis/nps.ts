import { http } from "./http";

// ---- tipos ----
export type NpsFilters = {
  from: string;   // "YYYY-MM-DD"
  to: string;     // "YYYY-MM-DD"
  clientId?: number;
  serviceId?: number;
};

export type NpsSummary = {
  nps: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  periodStart: string; // "YYYY-MM-DD"
  periodEnd: string;   // "YYYY-MM-DD"
};

export type NpsResponse = {
  id: number;
  clientName: string;
  serviceName: string;
  score: number;
  comment?: string;
  createdAt: string; // "YYYY-MM-DD"
};

export type Paged<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

// ---- llamadas ----
// OJO: ruta correcta = /api/ops/nps/...
export async function fetchNpsSummary(filters: NpsFilters) {
  const { data } = await http.post<NpsSummary>("/ops/nps/summary", filters);
  return data;
}

export async function fetchNpsResponses(
  filters: NpsFilters,
  page = 0,
  size = 10
) {
  const { data } = await http.post<Paged<NpsResponse>>(
    `/ops/nps/responses?page=${page}&size=${size}`,
    filters
  );
  return data;
}
