// src/apis/service.ts
import { http } from "./http";

// ===== Tipos alineados al backend =====
// En la BD: ENUM('MENSUAL')
export type BillingModel = "MENSUAL";

export type ServiceResponse = {
  id: number;
  orgId: number;
  name: string;
  billingModel: BillingModel;
  basePrice: number;
  isActive: boolean;
};

export type CreateServiceRequest = {
  orgId: number;
  name: string;
  // opcional, pero si no viene, igual enviaremos "MENSUAL"
  billingModel?: BillingModel;
  basePrice?: number;
};

export type UpdateServiceRequest = Partial<{
  name: string;
  billingModel: BillingModel;
  basePrice: number;
  isActive: boolean;
}>;

// Pequeño helper: siempre devolvemos "MENSUAL"
function normalizeBillingModel(v?: BillingModel | string): BillingModel {
  return "MENSUAL";
}

// ========= APIs =========

export async function getServices(params?: {
  orgId?: number;
  onlyActive?: boolean;
}) {
  const { data } = await http.get<ServiceResponse[]>("/services", { params });
  return data ?? [];
}

export async function getService(id: number) {
  const { data } = await http.get<ServiceResponse>(`/services/${id}`);
  return data;
}

export async function createService(body: CreateServiceRequest) {
  const payload = {
    ...body,
    billingModel: normalizeBillingModel(body.billingModel),
  };
  const { data } = await http.post<ServiceResponse>("/services", payload);
  return data;
}

export async function updateService(id: number, body: UpdateServiceRequest) {
  const payload = {
    ...body,
    billingModel: normalizeBillingModel(body.billingModel),
  };
  const { data } = await http.put<ServiceResponse>(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: number) {
  await http.delete(`/services/${id}`);
}
