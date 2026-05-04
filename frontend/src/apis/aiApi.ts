// src/apis/aiApi.ts
import { http } from "./http";

// ──────────────────────────────────────────────
// Activar SOLO para desarrollo sin backend.
// ⚠️ Desactivar antes de desplegar a producción.
// ──────────────────────────────────────────────
export const USE_AI_MOCK = false;

// Contextos alineados a las entidades reales del CRM
export type AiContextType =
  | "general"
  | "clientes"
  | "leads"
  | "cotizaciones"
  | "pagos"
  | "servicios"
  | "campanas"
  | "reportes";

export interface AiChatRequest {
  message: string;
  contextType: AiContextType;
}

export interface AiChatResponse {
  reply: string;
}

// Respuestas mock por contexto — solo para desarrollo local
const MOCK_REPLIES: Record<AiContextType, string> = {
  general:
    "Hola, soy el Asistente IA de VCM CRM. El backend aún no está conectado. Cuando el endpoint /api/ai/chat esté activo, recibirás respuestas reales de Gemini sobre tu CRM.",
  clientes:
    "[MOCK] Aquí analizaría tus clientes activos, sectores, tamaños y estado de contratos.",
  leads:
    "[MOCK] Aquí revisaría el estado del pipeline: leads nuevos, en progreso, contactados y convertidos.",
  cotizaciones:
    "[MOCK] Aquí resumiría cotizaciones pendientes de respuesta, aceptadas y rechazadas.",
  pagos:
    "[MOCK] Aquí analizaría pagos pendientes de cobro, cobros parciales y totales del mes.",
  servicios:
    "[MOCK] Aquí revisaría el catálogo de servicios, precios, estado activo/inactivo y contratos vigentes.",
  campanas:
    "[MOCK] Aquí analizaría campañas de email: enviadas, aperturas, clics y estado de envío.",
  reportes:
    "[MOCK] Aquí interpretaría KPIs, MRR, tasa de cierre, pipeline value y NPS del período seleccionado.",
};

export async function sendAiMessage(
  message: string,
  contextType: AiContextType
): Promise<string> {
  if (USE_AI_MOCK) {
    // eslint-disable-next-line no-console
    console.warn(
      "⚠️ USE_AI_MOCK activo — respuestas simuladas. Desactivar antes de producción."
    );
    await new Promise((r) => setTimeout(r, 1100));
    return MOCK_REPLIES[contextType] ?? MOCK_REPLIES.general;
  }

  const { data } = await http.post<AiChatResponse>("/ai/chat", {
    message,
    contextType,
  } satisfies AiChatRequest);

  return data.reply;
}
