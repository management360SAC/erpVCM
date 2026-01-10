// src/apis/auth.ts
import { http } from "./http";

export async function resetPassword(emailOrUsername: string) {
  // Tu backend permite POST /users/reset-password
  const { data } = await http.post("/users/reset-password", {
    identifier: emailOrUsername, // acepta email o username
  });
  return data;
}

// Tipo para la respuesta del login
export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  username: string;
  userId: number;
};

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const { data } = await http.post<LoginResponse>("/auth/login", {
    username,
    password,
  });

  // Guardar tokens
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("token", data.accessToken); // compatibilidad

  // Guardar datos de usuario
  localStorage.setItem("username", data.username);
  localStorage.setItem("userId", String(data.userId));

  return data;
}
