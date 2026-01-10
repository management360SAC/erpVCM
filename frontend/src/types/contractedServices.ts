import { http } from "../apis/http"
export type ServiceStatus =
  | "PENDIENTE"
  | "EN_EJECUCION"
  | "COMPLETADO"
  | "CANCELADO";

export type BillingStatus =
  | "NO_FACTURADO"
  | "FACTURADO_PARCIAL"
  | "FACTURADO_TOTAL";

export type CollectionStatus =
  | "PENDIENTE_COBRO"
  | "COBRO_PARCIAL"
  | "COBRADO";

// DTO de servicio contratado
export interface ContractedServiceDTO {
  id: number;
  number: string;
  quoteId?: number;
  clientId: number;
  orgId: number;
  status: ServiceStatus;
  billingStatus: BillingStatus;
  collectionStatus: CollectionStatus;
  subTotal: number;
  igv: number;
  total: number;
  contractDate?: string;
  startDate?: string;
  endDate?: string;
  assignedTo?: number;
  notes?: string;
  createdAt?: string;
  createdBy?: number;
  updatedAt?: string;
}

// Paginación estándar (Spring)
export interface Paged<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

// Listado con filtros (evita enviar q vacía)
export async function listContractedServices(params: {
  orgId: number;
  status?: ServiceStatus;
  q?: string;
  page?: number;
  size?: number;
}) {
  const { orgId, status, q, page = 0, size = 10 } = params;

  const qp: Record<string, any> = { orgId, page, size };
  if (status) qp.status = status;
  if (q && q.trim() !== "") qp.q = q.trim();

  const res = await http.get<Paged<ContractedServiceDTO>>(
    "/contracted-services",
    { params: qp }
  );
  return res.data;
}

// (Opcionales) utilidades que seguro usarás:
export async function getContractedService(id: number) {
  const res = await http.get<ContractedServiceDTO>(`/contracted-services/${id}`);
  return res.data;
}

export async function updateExecutionStatus(id: number, status: ServiceStatus) {
  const res = await http.patch<ContractedServiceDTO>(
    `/contracted-services/${id}/status`,
    null,
    { params: { status } }
  );
  return res.data;
}

export async function recomputeStates(id: number) {
  const res = await http.patch<ContractedServiceDTO>(
    `/contracted-services/${id}/recompute`
  );
  return res.data;
}

export async function completeIfPossible(id: number) {
  const res = await http.patch<ContractedServiceDTO>(
    `/contracted-services/${id}/complete`
  );
  return res.data;
}

export async function deleteContractedService(id: number) {
  await http.delete<void>(`/contracted-services/${id}`);
}