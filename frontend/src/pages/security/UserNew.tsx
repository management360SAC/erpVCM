// src/pages/seguridad/UserNew.tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../../layout/AppLayout'
import {
  Alert, Avatar, Backdrop, Box, Breadcrumbs, Button, Chip, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle, Divider, Grid, MenuItem,
  Paper, Stack, TextField, Typography
} from '@mui/material'
import dayjs from 'dayjs'
import { createUser, type CreateUserRequest, type SexDB } from '../../apis/user'

const ROLES = ['ADMIN', 'COMERCIAL', 'OPERACIONES', 'DIRECCION'] as const
const SEXOS_UI = ['MASCULINO', 'FEMENINO', 'OTRO'] as const

function uiSexoToDB(v: string): SexDB {
  if (v === 'MASCULINO') return 'M'
  if (v === 'FEMENINO') return 'F'
  return null
}

export default function UserNew() {
  const nav = useNavigate()

  // asegura sesión
  const token = useMemo(
    () => localStorage.getItem('accessToken') || localStorage.getItem('token'),
    []
  )
  if (!token) { nav('/login'); return null }

  // estado del form
  const [form, setForm] = useState({
    orgId: 1,
    username: '',
    password: '',
    nombre: '',
    rol: 'COMERCIAL',
    email: '',
    direccion: '',
    celular: '',
    isActive: true,
    dni: '',
    cargo: '',
    sexoUI: 'OTRO' as (typeof SEXOS_UI)[number],
    fechaDeAlta: dayjs().format('YYYY-MM-DD'),
  })

  const handle = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(s => ({ ...s, [k]: e.target.value }))

  const toggleActivo = () => setForm(s => ({ ...s, isActive: !s.isActive }))

  // control
  const [saving, setSaving] = useState(false)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  // Backdrop de “procesando 3s”
  const [processing, setProcessing] = useState(false)

  // Modal resultado
  const [openResult, setOpenResult] = useState(false)
  const [resultOk, setResultOk] = useState(false)
  const [resultMsg, setResultMsg] = useState('')

  const onSave = async () => {
    setErrMsg(null)
    if (!form.username.trim() || !form.password.trim() || !form.nombre.trim() || !form.email.trim()) {
      setErrMsg('Completa usuario, contraseña, nombre y correo.')
      return
    }

    const payload: CreateUserRequest = {
      orgId: Number(form.orgId) || 1,
      username: form.username.trim(),
      password: form.password.trim(),
      nombre: form.nombre.trim(),
      rol: form.rol,
      email: form.email.trim(),
      direccion: form.direccion || '',
      celular: form.celular || '',
      isActive: form.isActive,
      dni: form.dni || null,
      cargo: form.cargo || null,
      sexo: uiSexoToDB(form.sexoUI),
      fechaDeAlta: form.fechaDeAlta || null,
    }

    try {
      setSaving(true)
      setProcessing(true)

      const created = await createUser(payload)

      // mostramos loading extra de 3s antes de la respuesta
      setTimeout(() => {
        setProcessing(false)
        setResultOk(true)
        setResultMsg(`Usuario "${created.username}" creado correctamente.`)
        setOpenResult(true)
      }, 3000)
    } catch (e) {
      setTimeout(() => {
        setProcessing(false)
        setResultOk(false)
        setResultMsg('No se pudo crear el usuario. Revisa los datos e inténtalo de nuevo.')
        setOpenResult(true)
      }, 3000)
    } finally {
      setSaving(false)
    }
  }

  const closeResult = () => {
    setOpenResult(false)
    if (resultOk) {
      nav('/seguridad/usuarios')           // volver al listado
      setTimeout(() => window.location.reload(), 100) // refrescar para ver el nuevo registro
    }
  }

  return (
    <AppLayout title="">
      {/* Loading 3s */}
      <Backdrop open={processing} sx={{ color: '#fff', zIndex: (t) => t.zIndex.modal + 1 }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography>Procesando…</Typography>
        </Stack>
      </Backdrop>

      {/* Modal de confirmación/resultado */}
      <Dialog open={openResult} onClose={closeResult} fullWidth maxWidth="xs">
        <DialogTitle>{resultOk ? '¡Listo!' : 'Ups…'}</DialogTitle>
        <DialogContent>
          <Typography>{resultMsg}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeResult} variant="contained">
            {resultOk ? 'Volver al listado' : 'Cerrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #eef2f7', background: '#f6f9ff' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={800} sx={{ mb: .5 }}>
              Nuevo Usuario
            </Typography>
            <Breadcrumbs>
              <Typography color="text.secondary">Seguridad</Typography>
              <Typography color="text.primary">Usuarios</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* Formulario */}
      <Stack spacing={3}>
        {/* Identidad */}
        <Section title="Identidad">
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth type="number" label="Org ID *"
                value={form.orgId}
                onChange={handle('orgId' as any)}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select fullWidth label="Perfil *"
                value={form.rol}
                onChange={handle('rol')}
              >
                {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </TextField>
            </Grid>

            <Grid item xs={12} md={3} sx={{ display: 'flex', alignItems: 'center' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="body2" color="text.secondary">Estado</Typography>
                <Chip
                  color={form.isActive ? 'success' : 'default'}
                  label={form.isActive ? 'ACTIVO' : 'INACTIVO'}
                  onClick={toggleActivo}
                  sx={{ fontWeight: 700 }}
                />
              </Stack>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField fullWidth label="Usuario *" value={form.username} onChange={handle('username')} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Nombres *" value={form.nombre} onChange={handle('nombre')} />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField fullWidth type="password" label="Contraseña *" value={form.password} onChange={handle('password')} />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField fullWidth label="DNI" value={form.dni} onChange={handle('dni')} />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                select fullWidth label="Sexo"
                value={form.sexoUI}
                onChange={(e) => setForm(prev => ({ ...prev, sexoUI: e.target.value as any }))}
              >
                {SEXOS_UI.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        </Section>

        {/* Contacto */}
        <Section title="Contacto">
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Correo Electrónico *" type="email" value={form.email} onChange={handle('email')} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Teléfono" value={form.celular} onChange={handle('celular')} />
            </Grid>
          </Grid>
          <Grid item xs={12} style={{ marginTop: 16 }}>
            <TextField fullWidth label="Dirección" value={form.direccion} onChange={handle('direccion')} />
          </Grid>
        </Section>

        {/* Configuración / Laboral */}
        <Section title="Configuración / Laboral">
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Cargo" value={form.cargo} onChange={handle('cargo')} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth label="Fecha de alta"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.fechaDeAlta}
                onChange={handle('fechaDeAlta')}
              />
            </Grid>
          </Grid>
        </Section>

        {errMsg && <Alert severity="error">{errMsg}</Alert>}

        {/* Barra de acciones */}
        <Paper elevation={0} sx={{
          position: 'sticky', bottom: 16, zIndex: 10, p: 2, borderRadius: 3,
          border: '1px solid #eef2f7', background: 'rgba(255,255,255,0.9)', backdropFilter: 'saturate(180%) blur(6px)'
        }}>
          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <Button variant="outlined" onClick={() => nav('/seguridad/usuarios')} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={onSave} disabled={saving}>
              {saving ? 'Guardando…' : 'Crear usuario'}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </AppLayout>
  )
}

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
