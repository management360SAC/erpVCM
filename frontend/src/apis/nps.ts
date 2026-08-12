import { http } from "./http";

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
  periodStart: string;
  periodEnd: string;
  responseRate?: number;
  responses?: number;
  sent?: number;
  csatAvg?: number;
  // Promedios por pregunta (1-5)
  avgQ1?: number;
  avgQ2?: number;
  avgQ3?: number;
  avgQ4?: number;
};

export type NpsResponse = {
  id: number;
  clientName: string;
  serviceName: string;
  q1?: number;
  q2?: number;
  q3?: number;
  q4?: number;
  score: number;
  comment?: string;
  createdAt: string;
  label?: string;
};

export type Paged<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export async function fetchNpsSummary(filters: NpsFilters) {
  const { data } = await http.post<NpsSummary>("/ops/nps/summary", filters);
  return data;
}

export async function fetchNpsResponses(filters: NpsFilters, page = 0, size = 10) {
  const { data } = await http.post<Paged<NpsResponse>>(
    `/ops/nps/responses?page=${page}&size=${size}`,
    filters
  );
  return data;
}
