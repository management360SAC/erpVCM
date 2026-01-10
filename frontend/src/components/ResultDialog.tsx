// src/components/ResultDialog.tsx
import { useEffect, useMemo, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Stack, Typography, CircularProgress, Button
} from '@mui/material'
import { CheckCircleOutline, ErrorOutline } from '@mui/icons-material'

type Variant = 'success' | 'error'

interface ResultDialogProps {
  open: boolean
  onClose: () => void
  title: string              // Título a mostrar cuando termine el loading
  message?: string | null    // Mensaje a mostrar cuando termine el loading
  variant?: Variant          // success | error
  delayMs?: number           // duración del loading inicial (default 3000ms)
}

export default function ResultDialog({
  open,
  onClose,
  title,
  message,
  variant = 'success',
  delayMs = 3000
}: ResultDialogProps) {
  const [phase, setPhase] = useState<'loading' | 'result'>('loading')

  // Reinicia fase a "loading" cada vez que se abre el modal
  useEffect(() => {
    let t: number | undefined
    if (open) {
      setPhase('loading')
      t = window.setTimeout(() => setPhase('result'), delayMs)
    }
    return () => {
      if (t) window.clearTimeout(t)
    }
  }, [open, delayMs])

  const icon = useMemo(() => {
    if (variant === 'success') return <CheckCircleOutline fontSize="large" />
    return <ErrorOutline fontSize="large" />
  }, [variant])

  return (
    <Dialog open={open} onClose={phase === 'loading' ? undefined : onClose} maxWidth="xs" fullWidth>
      {phase === 'loading' ? (
        <>
          <DialogContent sx={{ py: 4 }}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" align="center">
                Un momento, por favor…
              </Typography>
            </Stack>
          </DialogContent>
        </>
      ) : (
        <>
          <DialogTitle sx={{ pb: 1 }}>
            {title}
          </DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            <Stack alignItems="center" spacing={2} sx={{ my: 1 }}>
              {icon}
              {message && (
                <Typography variant="body1" align="center">
                  {message}
                </Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" onClick={onClose} autoFocus>
              Aceptar
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}
