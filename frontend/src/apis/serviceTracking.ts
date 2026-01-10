// src/apis/serviceTracking.ts
import { http } from "./http";

export type ServiceExpiryRow = {
  clientServiceId: number;
  clientId: number;
  clientName: string;
  serviceId: number;
  serviceName: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  daysRemaining: number;
  severity: "OK" | "WARN" | "CRITICAL" | "EXPIRED";
};

export type ServiceTrackingSummary = {
  totalActive: number;
  expiringSoon: number;
  expired: number;
  windowDays: number;
};

// 🔹 Función auxiliar opcional para limpiar undefined/null
const clean = <T extends Record<string, any>>(obj: T) =>
  Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined && v !== null)
  ) as T;

// 🔸 Cambiamos GET → POST, enviando body JSON { withinDays }
export async function getTrackingSummary(
  withinDays = 30
): Promise<ServiceTrackingSummary> {
  const { data } = await http.post<ServiceTrackingSummary>(
    "/ops/service-tracking/summary",
    { withinDays }
  );
  return data;
}

// 🔸 También cambiamos a POST y enviamos body { withinDays, clientId }
export async function getExpiring(
  withinDays = 30,
  clientId?: number
): Promise<ServiceExpiryRow[]> {
  const payload = clean({ withinDays, clientId });
  const { data } = await http.post<ServiceExpiryRow[]>(
    "/ops/service-tracking/expiring",
    payload
  );
  return data;
}

// 🔸 Este ya era POST, solo aseguramos que envíe body vacío
export async function refreshServiceStatuses(): Promise<string> {
  const { data } = await http.post<string>(
    "/ops/service-tracking/refresh-status",
    {}
  );
  return data;
}
