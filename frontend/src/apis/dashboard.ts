import { http } from "./http";

export type DashboardSummary = {
  year: number;
  month: number;
  totalClientes: number;
  serviciosActivos: number;
  mrrReal: number;
  mrrProjected: number;
  pctCumplimiento: number;
  pendienteCobro: number;
  totalFacturadoMes: number;
  pipelineValue: number;
  totalLeads30d: number;
  tasaCierre: number;
  hasManualProjection: boolean;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await http.get<DashboardSummary>("/dashboard/summary");
  return res.data;
}
