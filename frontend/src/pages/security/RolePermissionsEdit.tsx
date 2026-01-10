import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import AppLayout from '../../layout/AppLayout'
import PermissionMatrix, { presetForRole } from '../../components/PermissionMatrix'
import { getRoleById, getRolePermissions, updateRolePermissions, type Permission } from '../../apis/role'

export default function RolePermissionsEdit() {
  const nav = useNavigate()
  const { id } = useParams<{ id: string }>()
  const roleId = Number(id)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [roleName, setRoleName] = useState<string>('ROL')
  const [perms, setPerms] = useState<Permission[]>([])

  useEffect(() => {
    document.title = 'Permisos del Rol'
    ;(async () => {
      try {
        setLoading(true); setErr(null)
        const [r, p] = await Promise.all([getRoleById(roleId), getRolePermissions(roleId)])
        setRoleName(r.name)
        setPerms(p && p.length ? p : presetForRole(r.name))
      } catch {
        setErr('No se pudieron cargar los permisos.')
      } finally {
        setLoading(false)
      }
    })()
  }, [roleId])

  const onSave = async () => {
    try {
      setSaving(true); setErr(null); setOk(null)
      await updateRolePermissions(roleId, perms)
      setOk('Permisos guardados correctamente.')
      setTimeout(()=>nav('/seguridad/roles'), 500)
    } catch {
      setErr('No se pudo guardar.')
    } finally { setSaving(false) }
  }

  if (loading) {
    return (
      <AppLayout title="">
        <Box sx={{ p:6, display:'grid', placeItems:'center' }}><CircularProgress/></Box>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="">
      <Paper elevation={0} sx={{ p:3, mb:2, borderRadius:3, border:'1px solid #eef2f7', background:'#f6f9ff' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight={800}>Permisos • {roleName}</Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={()=>nav('/seguridad/roles')} disabled={saving}>Cancelar</Button>
            <Button variant="contained" onClick={onSave} disabled={saving}>{saving?'Guardando…':'Guardar'}</Button>
          </Stack>
        </Stack>
      </Paper>

      <PermissionMatrix value={perms} onChange={setPerms} />

      {err && <Alert sx={{ mt:2 }} severity="error">{err}</Alert>}
      {ok && <Alert sx={{ mt:2 }} severity="success">{ok}</Alert>}
    </AppLayout>
  )
}
