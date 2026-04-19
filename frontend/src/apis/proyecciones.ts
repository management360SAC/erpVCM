import { http } from "./http";

export type ManualProjection = {
  id: number;
  orgId: number;
  year: number;
  month: number | null; // null = anual
  amount: number;
  createdAt: string;
  updatedAt: string;
};

export async function getManualProjections(year?: number): Promise<ManualProjection[]> {
  const params = year ? `?year=${year}` : "";
  const res = await http.get<ManualProjection[]>(`/proyecciones${params}`);
  return res.data;
}

export async function upsertManualProjection(data: {
  year: number;
  month: number | null;
  amount: number;
}): Promise<ManualProjection> {
  const res = await http.post<ManualProjection>("/proyecciones", data);
  return res.data;
}

export async function deleteManualProjection(id: number): Promise<void> {
  await http.delete(`/proyecciones/${id}`);
}
