 // Archivo de servicios (api/leads.ts o similar)
import { http } from './http'

export type LeadStats = {
  bySource: Array<{ source: string; total: number }>;
  byForm: Array<{ form_id: number; form_name: string; total: number }>;
  total: number;
};

export async function getLeadStats(params: { from: string; to: string; source?: string }) {
  // CAMBIO: Remover /api del inicio
  const res = await http.get<LeadStats>("/leads/stats", { params });
  return res.data;
}