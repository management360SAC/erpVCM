// src/apis/alertsApi.ts
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ============================================================
// INTERFACES
// ============================================================

export interface AlertItem {
  id: number;

  // Campos del backend
  title: string;
  message: string;
  createdAt: string;
  updatedAt?: string;
  readAt?: string | null;

  // 🔹 nuevo: dueño de la alerta
  userId?: number | null;

  // Campos adicionales para recordatorios
  titulo?: string;             // Alias para title
  descripcion?: string;        // Alias para message
  proximaEjecucion?: string;   // Fecha/hora de ejecución
  repeticion?: string;         // "No se repite", "Diario", etc.
  canal?: string;              // "En la app", "Email", etc.
  estado?: string;             // "Activo", "Inactivo"
  activo?: boolean;            // Estado booleano
  leido?: boolean;             // Alias para readAt
  entidadId?: number | null;   // ID de lead/cliente
  entidadTipo?: string | null; // "Lead", "Cliente", etc.
}

interface ListAlertsParams {
  all?: boolean;
  page?: number;
  size?: number;
  activo?: boolean;
  leido?: boolean;
  userId?: number;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
  totalPages?: number;
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Normaliza una fecha/hora para que el backend (LocalDateTime)
 * la pueda parsear sin problemas.
 */
function normalizeDateTimeForBackend(value?: string): string | undefined {
  if (!value) return undefined;

  let v = value.trim();

  // Quitar Z (UTC)
  if (v.endsWith("Z")) {
    v = v.slice(0, -1);
  }

  // Quitar milisegundos
  const dotIndex = v.indexOf(".");
  if (dotIndex !== -1) {
    v = v.substring(0, dotIndex);
  }

  // Si solo viene hasta minutos (length 16 → "YYYY-MM-DDTHH:mm")
  if (v.length === 16) {
    v = v + ":00";
  }

  return v;
}

/**
 * Prepara el payload antes de enviarlo al backend:
 * - Mapea titulo/descripcion → title/message si vienen así
 * - Normaliza proximaEjecucion al formato LocalDateTime
 * - Asigna userId desde localStorage si no viene
 */
function preparePayload(payload: Partial<AlertItem>): Partial<AlertItem> {
  const data: Partial<AlertItem> = { ...payload };

  // Mapear alias de texto
  if (data.titulo && !data.title) {
    data.title = data.titulo;
  }
  if (data.descripcion && !data.message) {
    data.message = data.descripcion;
  }

  // Normalizar fecha/hora
  if (data.proximaEjecucion) {
    data.proximaEjecucion = normalizeDateTimeForBackend(
      data.proximaEjecucion
    );
  }

  // 🔹 Asignar userId del usuario logueado si no viene
  if (typeof window !== "undefined" && (data.userId == null)) {
    const raw = localStorage.getItem("userId");
    if (raw) {
      const n = Number(raw);
      if (!Number.isNaN(n)) {
        data.userId = n;
      }
    }
  }

  return data;
}

// ============================================================
// FUNCIONES DE API
// ============================================================

/**
 * Lista alertas/recordatorios con paginación
 * GET /api/alerts-reminders/alerts
 */
export const listAlerts = async (
  params: ListAlertsParams = {}
): Promise<Page<AlertItem>> => {
  try {
    console.log("📡 API: Solicitando alertas con params:", params);

    const response = await api.get<Page<AlertItem>>(
      "/alerts-reminders/alerts",
      { params }
    );

    console.log("✅ API: Alertas recibidas:", response.data);

    // Normalizar los datos para asegurar compatibilidad en el front
    const normalized: Page<AlertItem> = {
      ...response.data,
      content: response.data.content.map((alert) => ({
        ...alert,
        titulo: alert.titulo || alert.title,
        descripcion: alert.descripcion || alert.message,
        leido:
          alert.leido !== undefined
            ? alert.leido
            : alert.readAt != null, // true si tiene readAt
      })),
    };

    return normalized;
  } catch (error) {
    console.error("❌ API: Error obteniendo alertas:", error);
    throw error;
  }
};

/**
 * Crea una nueva alerta/recordatorio
 * POST /api/alerts-reminders/alerts
 */
export const createAlert = async (
  payload: Partial<AlertItem>
): Promise<AlertItem> => {
  try {
    const body = preparePayload(payload);
    console.log("📡 API: Creando alerta:", body);

    const response = await api.post<AlertItem>(
      "/alerts-reminders/alerts",
      body
    );

    console.log("✅ API: Alerta creada:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ API: Error creando alerta:", error);
    throw error;
  }
};

/**
 * Actualiza una alerta existente
 * PUT /api/alerts-reminders/alerts/{id}
 */
export const updateAlert = async (
  id: number,
  payload: Partial<AlertItem>
): Promise<AlertItem> => {
  try {
    const body = preparePayload(payload);
    console.log(`📡 API: Actualizando alerta ${id}:`, body);

    const response = await api.put<AlertItem>(
      `/alerts-reminders/alerts/${id}`,
      body
    );

    console.log("✅ API: Alerta actualizada:", response.data);
    return response.data;
  } catch (error) {
    console.error(`❌ API: Error actualizando alerta ${id}:`, error);
    throw error;
  }
};

/**
 * Marca una alerta como leída
 * Backend: PUT /api/alerts-reminders/alerts/{id}/read
 */
export const markAlertRead = async (id: number): Promise<void> => {
  try {
    console.log(`📡 API: Marcando alerta ${id} como leída`);

    await api.put(`/alerts-reminders/alerts/${id}/read`);

    console.log(`✅ API: Alerta ${id} marcada como leída`);
  } catch (error) {
    console.error(`❌ API: Error marcando alerta ${id} como leída:`, error);
    throw error;
  }
};

/**
 * Elimina una alerta
 * DELETE /api/alerts-reminders/alerts/{id}
 */
export const deleteAlert = async (id: number): Promise<void> => {
  try {
    console.log(`📡 API: Eliminando alerta ${id}`);

    await api.delete(`/alerts-reminders/alerts/${id}`);

    console.log(`✅ API: Alerta ${id} eliminada`);
  } catch (error) {
    console.error(`❌ API: Error eliminando alerta ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene alertas activas y no leídas que deben ejecutarse ahora
 * (filtro adicional en el frontend)
 */
export const getPendingAlerts = async (): Promise<AlertItem[]> => {
  try {
    console.log("📡 API: Obteniendo alertas pendientes");

    const response = await listAlerts({
      activo: true,
      leido: false,
      page: 0,
      size: 100,
    });

    const now = new Date();

    const pending = response.content.filter((alert) => {
      if (!alert.proximaEjecucion) return false;
      const nextExec = new Date(alert.proximaEjecucion);
      return nextExec <= now;
    });

    console.log(
      `✅ API: ${pending.length} alertas pendientes de ${response.content.length} totales`
    );

    return pending;
  } catch (error) {
    console.error("❌ API: Error obteniendo alertas pendientes:", error);
    throw error;
  }
};

/**
 * Ejecuta una alerta (si tuvieras un endpoint /execute)
 * por ahora usa /read como fallback.
 */
export const executeAlert = async (id: number): Promise<void> => {
  try {
    console.log(`📡 API: Ejecutando alerta ${id}`);

    await api.post(`/alerts-reminders/alerts/${id}/execute`);

    console.log(`✅ API: Alerta ${id} ejecutada`);
  } catch (error) {
    console.warn(
      `⚠️ API: Endpoint /execute no disponible, usando /read como fallback`
    );
    await markAlertRead(id);
  }
};
