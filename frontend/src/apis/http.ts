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
// - Si el backend responde 401 (no autorizado / token expirado):
//   • Limpia tokens de localStorage
//   • Redirige a /login
// ============================================================
http.interceptors.response.use(
  (resp) => resp,
  (error) => {
    if (error?.response?.status === 401) {
      if (typeof window !== "undefined") {
        console.warn("⚠️ 401 recibido. Cerrando sesión…");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
