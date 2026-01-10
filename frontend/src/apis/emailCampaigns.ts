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
  headerImage?: File | null;
};

// La respuesta del backend es igual al tipo Campaign del front
export type EmailCampaignResponse = Campaign;

// 🔹 GET: listar campañas por orgId
export async function getEmailCampaigns(orgId: number): Promise<Campaign[]> {
  const res = await http.get<EmailCampaignResponse[]>(
    "/marketing/email/campaigns",
    {
      params: { orgId },
    }
  );
  return res.data;
}

export async function createEmailCampaign(data: CreateCampaignRequest) {
  const fd = new FormData();
  fd.append("orgId", String(data.orgId));
  fd.append("name", data.name);
  fd.append("subject", data.subject);
  fd.append("bodyHtml", data.bodyHtml);

  if (data.scheduledAt) {
    fd.append("scheduledAt", data.scheduledAt);
  }

  fd.append("clientIds", JSON.stringify(data.clientIds));

  if (data.headerImage) {
    fd.append("headerImage", data.headerImage, data.headerImage.name);
  }

  const res = await http.post("/marketing/email/campaigns", fd, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}
