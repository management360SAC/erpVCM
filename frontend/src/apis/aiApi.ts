// src/apis/aiApi.ts
import { http } from "./http";

export const USE_AI_MOCK = false;

export type AiContextType =
  | "general"
  | "clientes"
  | "leads"
  | "cotizaciones"
  | "pagos"
  | "servicios"
  | "campanas"
  | "reportes";

export interface AiChatRequest  { message: string; contextType: AiContextType; }
export interface AiChatResponse { reply: string; }
export interface AiImageRequest  { prompt: string; }
export interface AiImageResponse { imageUrl: string; message: string; }

const MOCK_REPLIES: Record<AiContextType, string> = {
  general:      "Hola, soy el Asistente IA de VCM CRM. El backend aún no está conectado.",
  clientes:     "[MOCK] Aquí analizaría tus clientes activos.",
  leads:        "[MOCK] Aquí revisaría el estado del pipeline.",
  cotizaciones: "[MOCK] Aquí resumiría cotizaciones pendientes.",
  pagos:        "[MOCK] Aquí analizaría pagos pendientes.",
  servicios:    "[MOCK] Aquí revisaría el catálogo de servicios.",
  campanas:     "[MOCK] Aquí analizaría campañas de email.",
  reportes:     "[MOCK] Aquí interpretaría KPIs y métricas.",
};

export async function sendAiMessage(message: string, contextType: AiContextType): Promise<string> {
  if (USE_AI_MOCK) {
    await new Promise((r) => setTimeout(r, 1100));
    return MOCK_REPLIES[contextType] ?? MOCK_REPLIES.general;
  }
  const { data } = await http.post<AiChatResponse>("/ai/chat", { message, contextType } satisfies AiChatRequest);
  return data.reply;
}

export async function generateAiImage(prompt: string): Promise<AiImageResponse> {
  const { data } = await http.post<AiImageResponse>("/ai/generate-image", { prompt } satisfies AiImageRequest);
  return data;
}

export async function sendAiEmail(
  to: string,
  subject: string,
  htmlBody: string,
  pdfBlob?: Blob,
  pdfFilename?: string
): Promise<void> {
  const form = new FormData();
  form.append("to", to);
  form.append("subject", subject);
  form.append("htmlBody", htmlBody);
  if (pdfBlob) form.append("pdf", pdfBlob, pdfFilename ?? "cotizacion.pdf");
  await http.post("/ai/email/send", form);
}
