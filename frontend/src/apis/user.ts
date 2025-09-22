// src/apis/user.ts
import { http } from './http'

export type UserResponse = {
  id: number
  orgId: number
  username: string
  nombre: string
  rol: string
  email: string
  direccion: string
  celular: string
  isActive: boolean
}

export async function getUsers(): Promise<UserResponse[]> {
  const { data } = await http.get<UserResponse[]>('/users')
  return data
}
