// src/apis/clientService.ts
import { http } from './http';

export interface ClientServiceDTO {
  id: number;
  clientId: number;
  serviceId: number;
  serviceName?: string;
  startDate?: string | null;
  endDate?: string | null;
  price?: number;
  active: boolean;       // backend
  isActive?: boolean;    // UI
  notes?: string;
}

export async function getClientServices(
  clientId: number,
  onlyActive?: boolean
): Promise<ClientServiceDTO[]> {
  const { data } = await http.post<ClientServiceDTO[]>(
    '/client-services/list',
    { clientId, onlyActive }
  );

  // Normalizamos: siempre devolvemos isActive
  return data.map(d => ({
    ...d,
    isActive: d.isActive ?? d.active ?? false,
  }));
}

export async function attachClientService(
  clientId: number,
  serviceId: number,
  payload: ClientServiceDTO
) {
  const { data } = await http.post<ClientServiceDTO>(
    `/client-services/${clientId}/${serviceId}`,
    payload
  );
  return data;
}

export async function detachClientService(clientId: number, serviceId: number) {
  await http.delete(`/client-services/${clientId}/${serviceId}`);
}

export async function updateClientService(
  clientServiceId: number,
  payload: Partial<ClientServiceDTO>
) {
  const { data } = await http.patch<ClientServiceDTO>(
    `/client-services/${clientServiceId}`,
    payload
  );
  return data;
}
