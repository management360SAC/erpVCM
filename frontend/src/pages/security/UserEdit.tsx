// src/pages/seguridad/UserEdit.tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box, Paper, Stack, Typography, Breadcrumbs, Avatar, Divider,
  Grid, TextField, MenuItem, Button, Chip, CircularProgress
} from '@mui/material'
import AppLayout from '../../layout/AppLayout'
import { getUserById, updateUser, type UserResponse } from '../../apis/user'
import ResultDialog from '../../components/ResultDialog'

const ROLES = ['ADMIN', 'COMERCIAL', 'OPERACIONES', 'DIRECCION']

// Mostrar en UI, guardar en BD "M" | "F" | "O"
const SEXOS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'O', label: 'Otro' }
]

export default function UserEdit() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<UserResponse | null>(null)

  // Modal de resultado
  const [dlgOpen, setDlgOpen] = useState(false)
  const [dlgTitle, setDlgTitle] = useState('')
  const [dlgMsg, setDlgMsg] = useState<string | null>(null)
  const [dlgVariant, setDlgVariant] = useState<'success' | 'error'>('success')

  const token = useMemo(
    () => localStorage.getItem('accessToken') || localStorage.getItem('token'),
    []
  )

  useEffect(() => {
    document.title = 'Editar Usuario'
    if (!token) { nav('/login'); return }

    (async () => {
      try {
        setLoading(true)
        const data = await getUserById(Number(id))
        setUser(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [id, nav, token])

  const onSave = async () => {
    if (!user) return
    try {
      setSaving(true)

      const payload = {
        name: user.name ?? '',
        role: user.role ?? 'COMERCIAL',
        email: user.email ?? '',
        direccion: user.direccion ?? '',
        celular: user.celular ?? '',
        active: Boolean(user.active),          // <- se mapea a 1/0 en BD
        dni: user.dni ?? null,
        cargo: user.cargo ?? null,
        sexo: user.sexo ?? null,              // "M" | "F" | "O" | null
        fechaDeAlta: user.fechaDeAlta ?? null
      }

      const saved = await updateUser(user.id, payload)
      setUser(saved)

      setDlgVariant('success')
      setDlgTitle('Usuario actualizado')
      setDlgMsg('Los datos del usuario se actualizaron con éxito.')
      setDlgOpen(true)
    } catch (e) {
      setDlgVariant('error')
      setDlgTitle('No se pudo guardar los cambios')
      setDlgMsg('Revisa los campos e inténtalo de nuevo.')
      setDlgOpen(true)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout title="">
        <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}>
          <CircularProgress />
        </Box>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout title="">
        <Box sx={{ p: 6 }}>
          <Typography variant="h6">Usuario no encontrado.</Typography>
        </Box>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="">
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3, mb: 3, borderRadius: 3,
          border: '1px solid #eef2f7', background: '#f6f9ff'
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ mb: .5 }}>
              Actualización de Usuario
            </Typography>
            <Breadcrumbs>
              <Typography color="text.secondary">Seguridad</Typography>
              <Typography color="text.primary">Usuarios</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* Contenido */}
      <Stack spacing={3}>
        {/* Identidad */}
        <Section title="Identidad">
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                label="Perfil *"
                value={user.role || 'COMERCIAL'}
                onChange={(e) => setUser({ ...user, role: e.target.value })}
                helperText="Rol / perfil del usuario en el sistema"
              >
                {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">Estado</Typography>
                <Chip
                  color={user.active ? 'success' : 'default'}
                  label={user.active ? 'ACTIVO' : 'INACTIVO'}
                  onClick={() => setUser({ ...user, active: !user.active })}
                  sx={{ fontWeight: 700, cursor: 'pointer' }}
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField fullWidth label="Usuario" value={user.username} disabled />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombres *"
                value={user.name || ''}
                onChange={(e) => setUser({ ...user, name: e.target.value })}
              />
            </Grid>

            {/* opcionales */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="DNI"
                value={user.dni ?? ''}
                onChange={(e) => setUser({ ...user, dni: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Sexo"
                value={user.sexo ?? ''} // "M" | "F" | "O" | ""
                onChange={(e) => setUser({ ...user, sexo: e.target.value as 'M' | 'F' | 'O' })}
              >
                <MenuItem value="">(Sin especificar)</MenuItem>
                {SEXOS.map(s => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Section>

        {/* Contacto */}
        <Section title="Contacto">
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Correo Electrónico *"
                type="email"
                value={user.email || ''}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                value={user.celular || ''}
                onChange={(e) => setUser({ ...user, celular: e.target.value })}
              />
            </Grid>
          </Grid>

          <Grid item xs={12} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Dirección"
              value={user.direccion || ''}
              onChange={(e) => setUser({ ...user, direccion: e.target.value })}
            />
          </Grid>
        </Section>

        {/* Configuración / Laboral */}
        <Section title="Configuración / Laboral">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cargo"
                value={user.cargo ?? ''}
                onChange={(e) => setUser({ ...user, cargo: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Fecha de alta"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={user.fechaDeAlta ?? ''}
                onChange={(e) => setUser({ ...user, fechaDeAlta: e.target.value })}
              />
            </Grid>
          </Grid>
        </Section>

        {/* Barra de acciones */}
        <Paper
          elevation={0}
          sx={{
            position: 'sticky', bottom: 16, zIndex: 10,
            p: 2, borderRadius: 3, border: '1px solid #eef2f7',
            background: 'rgba(255,255,255,0.9)', backdropFilter: 'saturate(180%) blur(6px)'
          }}
        >
          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <Button variant="outlined" onClick={() => nav('/seguridad/usuarios')} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={onSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </Stack>
        </Paper>
      </Stack>

      {/* Modal de resultado */}
      <ResultDialog
        open={dlgOpen}
        onClose={() => {
          setDlgOpen(false)
          if (dlgVariant === 'success') {
            setTimeout(() => window.location.reload(), 200)
          }
        }}
        title={dlgTitle}
        message={dlgMsg}
        variant={dlgVariant}
        delayMs={3000}
      />
    </AppLayout>
  )
}

/** Tarjeta de sección */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #eef2f7' }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Paper>
  )
}
