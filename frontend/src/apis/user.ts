// src/apis/user.ts
import { http } from './http'

export type SexDB = 'M' | 'F' | 'O' | null

export type UserResponse = {
  id: number
  orgId: number
  username: string
  name: string           // <- viene del backend
  role: string           // <- viene del backend
  email: string
  direccion?: string | null
  celular?: string | null
  active: boolean        // <- viene del backend

  // opcionales extra
  dni?: string | null
  cargo?: string | null
  sexo?: SexDB
  fechaDeAlta?: string | null // yyyy-MM-dd
}

export type UpdateUserRequest = {
  name: string
  role: string
  email: string
  direccion?: string
  celular?: string
  active: boolean
  dni?: string | null
  cargo?: string | null
  sexo?: SexDB
  fechaDeAlta?: string | null
}

export type CreateUserRequest = {
  orgId: number
  username: string
  password: string
  name: string
  role: string
  email: string
  direccion?: string
  celular?: string
  active?: boolean
  dni?: string | null
  cargo?: string | null
  sexo?: SexDB
  fechaDeAlta?: string | null
}

// Lista
export async function getUsers(): Promise<UserResponse[]> {
  const { data } = await http.get<UserResponse[]>('/users')
  return data
}

// Detalle
export async function getUserById(id: number): Promise<UserResponse> {
  const { data } = await http.get<UserResponse>(`/users/${id}`)
  return data
}

// Crear
export async function createUser(body: CreateUserRequest): Promise<UserResponse> {
  const { data } = await http.post<UserResponse>('/users', body)
  return data
}

// Actualizar
export async function updateUser(id: number, body: UpdateUserRequest): Promise<UserResponse> {
  const { data } = await http.put<UserResponse>(`/users/${id}`, body)
  return data
}
