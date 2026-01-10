// src/apis/pipeline.ts
import { http } from "./http";   // ✅ usa tu módulo real

// ==================== Intake Lead ====================

export type IntakeLeadRequest = {
  orgId: number;
  sourceChannel: "EMAIL" | "ADS" | "LANDING" | "OTRO";
  sourceDetail?: string;
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  estimatedAmount?: number;
  ownerUserId?: number;
};

export type IntakeLeadResponse = {
  leadId: number;
  dealId: number;
};

export async function intakeLead(
  data: IntakeLeadRequest
): Promise<IntakeLeadResponse> {
  const res = await http.post("/marketing/intake", data);  // 👈 http correcto
  return res.data;
}

// ====================== Deals Board ======================

export type Deal = {
  id: number;
  orgId: number;
  title: string;
  amount?: number;
  stage:
    | "PROSPECTO"
    | "CONTACTO"
    | "CALIFICADO"
    | "PROPUESTA"
    | "GANADO"
    | "PERDIDO";
  status: "OPEN" | "WON" | "LOST";
};

export async function getDealsBoard(): Promise<Deal[]> {
  const res = await http.get("/deals");   // 👈 http correcto
  return res.data;
}

export async function updateDealStage(
  dealId: number,
  newStage: string
): Promise<void> {
  await http.patch(`/deals/${dealId}/stage`, { stage: newStage }); // 👈 http correcto
}
