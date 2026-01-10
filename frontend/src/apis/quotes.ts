// src/apis/quotes.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Obtener token de autenticación
const getAuthToken = () => {
  return localStorage.getItem('accessToken') || localStorage.getItem('token');
};

// Configuración base de axios con autenticación
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

axiosInstance.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== TIPOS ====================
export interface QuoteItem {
  serviceId: number;
  cost: number;
  name: string;
}

export interface QuoteTotals {
  subTotal: number;
  igv: number;
  total: number;
}

export interface QuoteMeta {
  orgId: number;
  sector: 'PRIVADO' | 'PUBLICO';
}

export interface CreateQuotePayload {
  clientId: number | null;
  sendTo: string;
  emailTo?: string;
  items: QuoteItem[];
  totals: QuoteTotals;
  meta: QuoteMeta;
  validUntil?: string | null;
  notes?: string;
  sector?: string;
  orgId?: number;
}

export interface QuoteResponse {
  id: number;
  number: string;
  clientId: number;
  sector: string;
  subTotal: number;
  igv: number;
  total: number;
  status: string;
  emailTo: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
  validUntil?: string;
  notes?: string;
}

export interface QuoteItemResponse {
  id: number;
  serviceId: number;
  name: string;
  cost: number;
}

export interface QuoteListParams {
  q?: string;
  status?: string;
  sector?: string;
  clientId?: string;
  page?: number;
  size?: number;
}

// ==================== FUNCIONES ====================

/**
 * Listar cotizaciones con paginación y filtros
 */
export async function getQuotes(params: QuoteListParams = {}): Promise<{
  content: QuoteResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}> {
  const response = await axiosInstance.get('/quotes', { params });
  return response.data;
}

/**
 * Obtener detalle de una cotización
 */
export async function getQuote(id: number): Promise<QuoteResponse> {
  const response = await axiosInstance.get(`/quotes/${id}`);
  return response.data;
}

/**
 * Obtener items de una cotización
 */
export async function getQuoteItems(id: number): Promise<QuoteItemResponse[]> {
  const response = await axiosInstance.get(`/quotes/${id}/items`);
  return response.data;
}

/**
 * Crear y enviar cotización por email con PDF adjunto
 * ✅ FUNCIÓN CORREGIDA
 */
export async function sendQuoteEmail(
  payload: CreateQuotePayload,
  pdfBlob: Blob,
  filename: string
): Promise<QuoteResponse> {
  const formData = new FormData();
  
  // ✅ CRÍTICO: Convertir payload a JSON string
  formData.append('data', JSON.stringify(payload));
  
  // ✅ Agregar el archivo PDF
  formData.append('file', pdfBlob, filename);

  const token = getAuthToken();

  // ✅ Usar fetch para mejor control del multipart/form-data
  const response = await fetch(`${API_BASE_URL}/quotes/email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // ❌ NO incluir Content-Type - el navegador lo configura automáticamente
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error al enviar cotización:', error);
    throw new Error(JSON.stringify(error));
  }

  return response.json();
}

/**
 * Crear cotización como borrador (sin enviar)
 */
export async function createQuoteDraft(
  payload: CreateQuotePayload
): Promise<QuoteResponse> {
  const response = await axiosInstance.post('/quotes', payload);
  return response.data;
}

/**
 * Actualizar estado de cotización
 */
export async function updateQuoteStatus(
  id: number,
  status: string,
  reason?: string
): Promise<QuoteResponse> {
  const response = await axiosInstance.patch(`/quotes/${id}/status`, {
    status,
    reason,
  });
  return response.data;
}

/**
 * Descargar PDF de cotización
 */
export async function downloadQuotePdf(id: number): Promise<Blob> {
  const response = await axiosInstance.get(`/quotes/${id}/file`, {
    responseType: 'blob',
  });
  return response.data;
}

/**
 * Obtener estadísticas de cotizaciones
 */
export async function getQuoteStats(): Promise<{
  totalQuotes: number;
  byStatus: Record<string, number>;
  totalAmount: number;
}> {
  const response = await axiosInstance.get('/quotes/stats');
  return response.data;
}