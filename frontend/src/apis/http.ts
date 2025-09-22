// src/apis/http.ts
import axios from 'axios'

export const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Adjunta JWT si existe
http.interceptors.request.use((config) => {
  // Buscar el token en el localStorage (preferir accessToken)
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
  
  if (token && token !== 'undefined') {
    if (!config.headers) config.headers = {}
    config.headers.Authorization = `Bearer ${token}`
  }
  
  return config
})

// Interceptor para manejar errores de autenticación
http.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el token expiró (401), redirigir al login
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)