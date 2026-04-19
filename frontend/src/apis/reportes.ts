/**
 * API service – Módulo Reportes & Analítica
 * Reutiliza el cliente http (axios) que ya gestiona Authorization + X-Tenant-Id.
 */
import { http } from "./http";

// ── Tipos ────────────────────────────────────────────────────────────────────

export interface SeriesPoint { label: string; value: number }
export interface CatPoint    { category: string; count: number }

export interface DashboardKpis {
  totalClientes: number;
  serviciosActivos: number;
  serviciosPendientes: number;
  pagosMesTotal: number;
  pagosMesCount: number;
  facturasAbiertas: number;
  facturasPendienteMonto: number;
  pipelineValue: number;
  dealsAbiertas: number;
  dealsGanadas: number;
  leadsNuevosMes: number;
  pagosPorMes: SeriesPoint[];
  leadsPorMes: SeriesPoint[];
  clientesPorSector: CatPoint[];
}

export interface PagoRow {
  id: number;
  number: string;
  invoiceNumber: string;
  clientNombre: string;
  amount: number;
  method: string;
  refCode: string | null;
  paidAt: string;
  createdAt: string;
}
export interface PagosResponse {
  content: PagoRow[];
  page: number; size: number;
  totalElements: number; totalPages: number;
  totalPagado: number;
}

export interface ClienteRow {
  id: number;
  legalName: string;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  serviciosCount: number;
  totalFacturado: number;
}
export interface ClientesResponse {
  content: ClienteRow[];
  page: number; size: number;
  totalElements: number; totalPages: number;
}

export interface DealRow {
  id: number;
  title: string;
  clientNombre: string | null;
  amount: number | null;
  stage: string;
  status: string;
  createdAt: string;
}
export interface PipelineResponse {
  content: DealRow[];
  page: number; size: number;
  totalElements: number; totalPages: number;
  totalPipelineValue: number;
  dealsGanadas: number;
  dealsPerdidas: number;
}

export interface AuditoriaRow {
  id: number;
  reportKey: string;
  username: string;
  filtrosJson: string | null;
  createdAt: string;
}
export interface AuditoriaResponse {
  content: AuditoriaRow[];
  page: number; size: number;
  totalElements: number; totalPages: number;
}

// ── Parámetros comunes ────────────────────────────────────────────────────────

export interface DateRangeParams {
  from?: string;  // YYYY-MM-DD
  to?: string;
}
export interface PagingParams {
  page?: number;
  size?: number;
  q?: string;
}

// ── Funciones ─────────────────────────────────────────────────────────────────

export async function getDashboard(p: DateRangeParams = {}): Promise<DashboardKpis> {
  const { data } = await http.get<DashboardKpis>("/reportes/dashboard", { params: p });
  return data;
}

export async function getPagos(
  p: DateRangeParams & PagingParams = {}
): Promise<PagosResponse> {
  const { data } = await http.get<PagosResponse>("/reportes/pagos", { params: p });
  return data;
}

export async function getClientes(
  p: PagingParams = {}
): Promise<ClientesResponse> {
  const { data } = await http.get<ClientesResponse>("/reportes/clientes", { params: p });
  return data;
}

export async function getPipeline(
  p: DateRangeParams & PagingParams & { stage?: string; status?: string } = {}
): Promise<PipelineResponse> {
  const { data } = await http.get<PipelineResponse>("/reportes/pipeline", { params: p });
  return data;
}

export async function getAuditoria(
  p: PagingParams = {}
): Promise<AuditoriaResponse> {
  const { data } = await http.get<AuditoriaResponse>("/reportes/auditoria", { params: p });
  return data;
}

/**
 * Dispara descarga CSV directamente en el navegador.
 * key = "pagos" | "clientes" | "pipeline"
 */
export function downloadCsv(
  key: string,
  params: DateRangeParams & { q?: string } = {}
) {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || "";
  const qs = new URLSearchParams();
  if (params.from)  qs.set("from", params.from);
  if (params.to)    qs.set("to",   params.to);
  if (params.q)     qs.set("q",    params.q);

  const url = `/api/reportes/export/${key}?${qs.toString()}`;
  // Usamos fetch para poder enviar el token y forzar descarga
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.blob())
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `reporte_${key}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
}
