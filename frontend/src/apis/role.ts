import { http } from './http'

/** Deben alinear con tu backend / Spring authorities */
export type Permission =
  | 'users:read' | 'users:write' | 'users:delete'
  | 'clients:read' | 'clients:write'
  | 'quotes:read' | 'quotes:write'
  | 'projects:read' | 'projects:write'
  | 'ops:read' | 'ops:write'
  | 'reports:read'
  | 'marketing:read'
  | 'integrations:read'

export type RoleDTO = {
  id?: number
  orgId?: number
  name: 'ADMIN' | 'COMERCIAL' | 'OPERACIONES' | 'DIRECCION' | string
  description?: string
  isActive: boolean
  /** Opcional si tu backend lo embebe — si no, usa los endpoints de /permissions */
  permissions?: Permission[]
}

/* -------- Roles CRUD -------- */
export async function getRoles(): Promise<RoleDTO[]> {
  const { data } = await http.get<RoleDTO[]>('/roles')
  return data
}
export async function getRoleById(id: number): Promise<RoleDTO> {
  const { data } = await http.get<RoleDTO>(`/roles/${id}`)
  return data
}
export async function createRole(body: RoleDTO): Promise<RoleDTO> {
  const { data } = await http.post<RoleDTO>('/roles', body)
  return data
}
export async function updateRole(id: number, body: RoleDTO): Promise<RoleDTO> {
  const { data } = await http.put<RoleDTO>(`/roles/${id}`, body)
  return data
}
export async function deleteRole(id: number): Promise<void> {
  await http.delete(`/roles/${id}`)
}

/* -------- Permisos por rol (ideal si usas role_permission) -------- */
export async function getRolePermissions(id: number): Promise<Permission[]> {
  const { data } = await http.get<Permission[]>(`/roles/${id}/permissions`)
  return data
}
export async function updateRolePermissions(id: number, perms: Permission[]): Promise<Permission[]> {
  const { data } = await http.put<Permission[]>(`/roles/${id}/permissions`, perms)
  return data
}
