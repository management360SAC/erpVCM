import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Paper, Stack, Typography, Button, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import SecurityIcon from '@mui/icons-material/Security'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { getRoles, deleteRole, type RoleDTO } from '../../apis/role'
import AppLayout from '../../layout/AppLayout'

export default function RolesList() {
  const nav = useNavigate()
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<RoleDTO[]>([])
  const [err, setErr] = useState<string | null>(null)

  const load = async () => {
    try {
      setLoading(true); setErr(null)
      const data = await getRoles()
      setRows(data)
    } catch {
      setErr('No se pudo cargar la lista de roles.')
    } finally {
      setLoading(false)
    }
  }
  useEffect(()=>{ document.title='Roles'; load() }, [])

  const onDelete = async (r: RoleDTO) => {
    if (!confirm(`¿Eliminar el rol "${r.name}"?`)) return
    try { await deleteRole(r.id!); await load() } catch { alert('No se pudo eliminar.') }
  }

  return (
    <AppLayout title="Roles y Permisos">
      <Paper elevation={0} sx={{ p: 3, mb: 2, borderRadius: 3, border: '1px solid #eef2f7', background: '#f6f9ff' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={800}>Roles</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => nav('/seguridad/roles/nuevo')}>
            Nuevo Rol
          </Button>
        </Stack>
      </Paper>

      {loading ? (
        <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      ) : err ? (
        <Typography color="error" sx={{ p: 2 }}>{err}</Typography>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #eef2f7' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={r.id ?? r.name}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell><strong>{r.name}</strong></TableCell>
                  <TableCell>{r.description || '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" color={r.isActive ? 'success' : 'default'} label={r.isActive ? 'ACTIVO' : 'INACTIVO'} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={()=>nav(`/seguridad/roles/${r.id}`)} title="Editar rol"><EditIcon /></IconButton>
                    <IconButton onClick={()=>nav(`/seguridad/roles/${r.id}/permisos`)} title="Permisos"><SecurityIcon /></IconButton>
                    <IconButton onClick={()=>onDelete(r)} title="Eliminar"><DeleteOutlineIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </AppLayout>
  )
}
