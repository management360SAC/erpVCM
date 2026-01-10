// src/apis/contractedServicesApi.ts
import { http } from "./http";
import type {
  Paged,
  ContractedServiceDTO,
  ServiceStatus,
} from "../types/contractedServices";

/** Listado paginado + filtros */
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

/** Detalle por ID */
export async function getContractedService(id: number) {
  const res = await http.get<ContractedServiceDTO>(`/contracted-services/${id}`);
  return res.data;
}

/**
 * Cambiar estado de ejecución.
 * Si envías endDate, el backend la usará para la fecha fin del servicio.
 */
export async function updateExecutionStatus(
  id: number,
  status: ServiceStatus,
  endDate?: string
) {
  const body: any = { status };
  if (endDate) body.endDate = endDate;

  const res = await http.patch<ContractedServiceDTO>(
    `/contracted-services/${id}/status`,
    body, // <-- AHORA SE ENVÍA EL BODY 🍀
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return res.data;
}


/** Recalcular estados de facturación/cobro/ejecución */
export async function recomputeStates(id: number) {
  const res = await http.patch<ContractedServiceDTO>(
    `/contracted-services/${id}/recompute`
  );
  return res.data;
}

/** Completar si cumple reglas de negocio */
export async function completeIfPossible(id: number) {
  const res = await http.patch<ContractedServiceDTO>(
    `/contracted-services/${id}/complete`
  );
  return res.data;
}

/** Eliminar registro */
export async function deleteContractedService(id: number) {
  await http.delete<void>(`/contracted-services/${id}`);
}
