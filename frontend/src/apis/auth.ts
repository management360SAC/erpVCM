// src/apis/auth.ts
import { http } from './http'

// Tipo para la respuesta del login
type LoginResponse = {
  accessToken: string
  refreshToken: string
}

export async function login(username: string, password: string) {
  const { data } = await http.post<LoginResponse>('/auth/login', { username, password })
  
  // Guardar ambos tokens
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  
  // También puedes guardar como 'token' para compatibilidad
  localStorage.setItem('token', data.accessToken)
  
  return data
}