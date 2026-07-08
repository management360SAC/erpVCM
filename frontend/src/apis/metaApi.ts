import { http } from "./http";

export type MetaStatus = "CONNECTED" | "DISCONNECTED";

export type MetaIntegrationResponse = {
  id: number;
  status: MetaStatus;
  pageId: string | null;
  pageName: string | null;
  verifyToken: string | null;
  lastSyncAt: string | null;
  webhookUrl: string;
};

export type MetaConnectRequest = {
  pageId: string;
  pageName: string;
  pageAccessToken: string;
  verifyToken: string;
};

export async function getMetaStatus(): Promise<MetaIntegrationResponse> {
  const { data } = await http.get<MetaIntegrationResponse>("/integrations/meta");
  return data;
}

export async function connectMeta(req: MetaConnectRequest): Promise<MetaIntegrationResponse> {
  const { data } = await http.post<MetaIntegrationResponse>("/integrations/meta/connect", req);
  return data;
}

export async function disconnectMeta(): Promise<void> {
  await http.delete("/integrations/meta/disconnect");
}
