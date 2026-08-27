// src/apis/http.ts
import axios, { AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

// ============================================================
// Cliente HTTP global
// ============================================================
//
// 👉 baseURL: "/api"
//    - En desarrollo, normalmente se configura un proxy en Vite:
//      /api → http://localhost:8080/api
//    - En producción, el backend puede servir bajo el mismo dominio.
//
// 👉 Este cliente se usa en todos los módulos de API:
//    import { http } from "./http";
//    http.get("/leads")
//    http.post("/alerts-reminders/alerts", body)
// ============================================================

export const http = axios.create({
  baseURL: "/api",
});

// ============================================================
// Interceptor REQUEST
// - Asegura headers
// - Maneja Content-Type (JSON vs FormData)
// - Adjunta JWT si existe en localStorage
// ============================================================
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Aseguramos que headers sea AxiosHeaders
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  } else if (!(config.headers instanceof AxiosHeaders)) {
    config.headers = new AxiosHeaders(config.headers);
  }

  const headers = config.headers as AxiosHeaders;

  // 1) Manejar Content-Type según el body
  if (config.data instanceof FormData) {
    // Dejar que el navegador maneje el boundary de multipart/form-data
    headers.delete("Content-Type");
    headers.delete("content-type");
  } else {
    // Cualquier otra cosa → JSON
    headers.set("Content-Type", "application/json");
  }

  // 2) Adjuntar token si existe
  //    Usa accessToken o token (por compatibilidad)
  const token =
    (typeof window !== "undefined" &&
      (localStorage.getItem("accessToken") || localStorage.getItem("token"))) ||
    null;

  if (token && token !== "undefined") {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

// ============================================================
// Interceptor RESPONSE
// - Si el backend responde 401 (token de acceso vencido), intenta
//   renovarlo una sola vez con el refreshToken (POST /api/auth/refresh)
//   y reintenta la petición original. Si el refresh también falla
//   (o no hay refreshToken guardado), recién ahí cierra sesión.
// ============================================================
let refreshPromise: Promise<string | null> | null = null;

function clearSessionAndRedirect() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("token");
  localStorage.removeItem("username");
  window.location.href = "/login";
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post("/api/auth/refresh", { refreshToken });
    if (data?.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken);
      return data.accessToken as string;
    }
    return null;
  } catch {
    return null;
  }
}

http.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const original = error?.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    if (error?.response?.status === 401 && original && !original._retried) {
      original._retried = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        const headers = original.headers instanceof AxiosHeaders
          ? original.headers
          : new AxiosHeaders(original.headers);
        headers.set("Authorization", `Bearer ${newAccessToken}`);
        original.headers = headers;
        return http(original);
      }
    }

    if (error?.response?.status === 401) {
      console.warn("⚠️ 401 recibido y no se pudo renovar la sesión. Cerrando sesión…");
      clearSessionAndRedirect();
    }
    return Promise.reject(error);
  }
);
