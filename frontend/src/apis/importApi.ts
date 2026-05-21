import { http } from "./http";

export interface CampoIgnorado {
  columna: string;
  valor: string;
  motivo: string;
}

export interface ImportPreviewRow {
  fila: number;
  // Cliente
  razonSocial: string;
  sector: string | null;
  contacto: string | null;
  emailDetectado: string | null;
  clienteExistente: boolean;
  // Deal
  tipoServicio: string | null;
  detalleServicio: string | null;
  fechaCotizacion: string | null;
  nroCotizacionExterno: string | null;
  fechaAprobacion: string | null;
  nroContrato: string | null;
  precioSoles: number | null;
  precioUsd: number | null;
  monedaUsada: string | null;
  estado: string | null;
  stageCrm: string;
  statusCrm: string;
  notas: string | null;
  // Facturación
  factura: string | null;
  cobro: number | null;
  saldoCobrar: number | null;
  camposIgnorados: CampoIgnorado[];
}

export interface ImportPreviewResponse {
  totalFilas: number;
  filasValidas: number;
  filas: ImportPreviewRow[];
  columnasNoImportadas: string[];
}

export interface ImportResultRow {
  fila: number;
  exito: boolean;
  mensaje: string;
  clienteId: number | null;
  dealId: number | null;
}

export interface ImportResultResponse {
  totalProcesadas: number;
  exitosas: number;
  fallidas: number;
  detalle: ImportResultRow[];
}

export async function previewImport(file: File): Promise<ImportPreviewResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await http.post<ImportPreviewResponse>("/api/import/preview", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function ejecutarImport(file: File): Promise<ImportResultResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await http.post<ImportResultResponse>("/api/import/ejecutar", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
