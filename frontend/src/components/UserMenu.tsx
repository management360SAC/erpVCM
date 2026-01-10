import { useMemo, useState } from 'react'
import {
  Avatar,
  Box,
  Button,
  Card,
  Divider,
  IconButton,
  Popover,
  Stack,
  Typography,
} from '@mui/material'
import LockResetIcon from '@mui/icons-material/LockReset'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import CloseIcon from '@mui/icons-material/Close'
import { resetPassword } from '../apis/auth'
import { useNavigate } from 'react-router-dom'

type UserMenuProps = {
  name?: string
  role?: string
  email?: string
  phone?: string
  avatarUrl?: string
}

function getInitials(fullName?: string) {
  if (!fullName) return 'U'
  const parts = fullName.trim().split(/\s+/)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export default function UserMenu(props: UserMenuProps) {
  const nav = useNavigate()
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const [loadingReset, setLoadingReset] = useState(false)

  const {
    name,
    role,
    email,
    phone,
    avatarUrl,
  } = useMemo(() => {
    const ls = (k: string) => localStorage.getItem(k) || undefined
    return {
      name: props.name ?? ls('userFullName') ?? ls('nombre') ?? ls('name') ?? 'Usuario',
      role: (props.role ?? ls('role') ?? ls('rol') ?? 'ADMIN').toUpperCase(),
      email: props.email ?? ls('email') ?? '',
      phone: props.phone ?? ls('phone') ?? ls('celular') ?? '',
      // ⬇⬇ Fallback a la imagen pública
      avatarUrl: props.avatarUrl ?? ls('avatarUrl') ?? '/images/user.png',
    }
  }, [props])

  const open = Boolean(anchorEl)
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)

  const handleReset = async () => {
    if (!email) return
    try {
      setLoadingReset(true)
      await resetPassword(email)
      alert('Se envió el reinicio de contraseña al correo del usuario.')
    } catch {
      alert('No se pudo solicitar el reinicio de contraseña.')
    } finally {
      setLoadingReset(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('token')
    localStorage.removeItem('userFullName')
    localStorage.removeItem('rol')
    localStorage.removeItem('role')
    localStorage.removeItem('email')
    localStorage.removeItem('celular')
    localStorage.removeItem('avatarUrl')
    nav('/login')
  }

  return (
    <>
      {/* Botón de avatar en AppBar */}
      <IconButton onClick={handleOpen} size="small" sx={{ ml: 1 }}>
        <Avatar
          src={avatarUrl || '/images/user.png'}
          sx={{ width: 40, height: 40 }}
        >
          {!avatarUrl && getInitials(name)}
        </Avatar>
      </IconButton>

      {/* Popover de perfil */}
      <Popover
        open={open}
        onClose={handleClose}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { borderRadius: 3, p: 0 } }}
      >
        <Card elevation={0} sx={{ p: 3, width: 420, borderRadius: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="start">
            <Typography variant="h6" fontWeight={800}>
              Perfil de Usuario
            </Typography>
            <IconButton size="small" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Stack>

          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <Avatar
              src={avatarUrl || '/images/user.png'}
              sx={{ width: 76, height: 76, fontSize: 28 }}
            >
              {!avatarUrl && getInitials(name)}
            </Avatar>

            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>
                {name}
              </Typography>
              <Typography sx={{ mt: .5 }} color="text.secondary">
                <strong>Rol:</strong> {role === 'ADMIN' ? 'ADMINISTRADOR' : role}
              </Typography>
              {phone && (
                <Typography color="text.secondary">
                  <strong>N°</strong> {phone}
                </Typography>
              )}
              {email && (
                <Typography color="text.secondary">
                  <strong>✉</strong> {email}
                </Typography>
              )}
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<LockResetIcon />}
              onClick={handleReset}
              disabled={loadingReset || !email}
              sx={{ py: 1.2, fontWeight: 700 }}
            >
              {loadingReset ? 'Enviando…' : 'Reiniciar contraseña'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<PowerSettingsNewIcon />}
              onClick={handleLogout}
              sx={{ py: 1.2, fontWeight: 700 }}
            >
              Cerrar sesión
            </Button>
          </Stack>
        </Card>
      </Popover>
    </>
  )
}
