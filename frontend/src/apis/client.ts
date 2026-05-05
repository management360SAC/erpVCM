// src/apis/client.ts
import { http } from "./http";

export type ClientResponse = {
  id?: number;
  orgId?: number;
  legalName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
};

export type CreateClientRequest = {
  orgId: number;
  legalName: string;
  taxId?: string;
  email?: string;
  phone?: string;
};

export type UpdateClientRequest = Partial<Omit<CreateClientRequest, "orgId">> & {
  legalName?: string;
};

// Lista
export async function getClients(): Promise<ClientResponse[]> {
  const { data } = await http.get<ClientResponse[]>("/clients");
  return data ?? [];
}

// Detalle
export async function getClient(id: number): Promise<ClientResponse> {
  const { data } = await http.get<ClientResponse>(`/clients/${id}`);
  return data;
}

// Crear
export async function createClient(body: CreateClientRequest): Promise<ClientResponse> {
  const { data } = await http.post<ClientResponse>("/clients", body);
  return data;
}

// Actualizar
export async function updateClient(id: number, body: UpdateClientRequest): Promise<ClientResponse> {
  const { data } = await http.put<ClientResponse>(`/clients/${id}`, body);
  return data;
}

// Eliminar
export async function deleteClient(id: number): Promise<void> {
  await http.delete(`/clients/${id}`);
}
