// src/apis/emailCampaigns.ts
import { http } from "./http";
import type { Campaign } from "../types/campaign";

export type CreateCampaignRequest = {
  orgId: number;
  name: string;
  scheduledAt?: string | null;
  subject: string;
  bodyHtml: string;
  clientIds: number[];
  /** Correos manuales que no pertenecen a clientes registrados */
  manualEmails?: string[];
  headerImage?: File | null;
};

export type EmailCampaignResponse = Campaign;

/** Lista de campañas por organización */
export async function getEmailCampaigns(orgId: number): Promise<Campaign[]> {
  const res = await http.get<EmailCampaignResponse[]>("/marketing/email/campaigns", {
    params: { orgId },
  });
  return res.data;
}

/** Crear y enviar campaña de email */
export async function createEmailCampaign(data: CreateCampaignRequest) {
  const fd = new FormData();
  fd.append("orgId",   String(data.orgId));
  fd.append("name",    data.name);
  fd.append("subject", data.subject);
  fd.append("bodyHtml", data.bodyHtml);

  if (data.scheduledAt) fd.append("scheduledAt", data.scheduledAt);

  // clientIds puede ser vacío si solo hay emails manuales
  fd.append("clientIds", JSON.stringify(data.clientIds ?? []));

  // emails manuales (nuevo)
  if (data.manualEmails && data.manualEmails.length > 0) {
    fd.append("manualEmails", JSON.stringify(data.manualEmails));
  }

  if (data.headerImage) {
    fd.append("headerImage", data.headerImage, data.headerImage.name);
  }

  const res = await http.post("/marketing/email/campaigns", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
