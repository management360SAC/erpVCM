// src/pages/pipeline/CotizacionRapidaModal.tsx
import { Dialog, DialogContent, DialogTitle, IconButton, Stack, Typography, Chip } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import CotizacionWizard from "../cotizaciones/CotizacionWizard";

export interface CotizacionRapidaModalProps {
  open: boolean;
  onClose: () => void;
  /** Oportunidad del embudo desde la que se dispara la cotización rápida. */
  dealId: number;
  dealTitle?: string;
  clientId?: number | null;
  clientName?: string;
  /** Se llama tras un envío exitoso, además de cerrar el modal (ej. refrescar el board). */
  onSent?: () => void;
}

export default function CotizacionRapidaModal({
  open,
  onClose,
  dealId,
  dealTitle,
  clientId,
  clientName,
  onSent,
}: CotizacionRapidaModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" scroll="paper">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Stack spacing={0.5}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="h6" fontWeight={800}>Cotización Rápida</Typography>
            <Chip size="small" color="warning" label="No se guarda en el historial" />
          </Stack>
          {dealTitle && (
            <Typography variant="body2" color="text.secondary">
              Oportunidad: {dealTitle}
            </Typography>
          )}
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ background: "#f8fafc" }}>
        <CotizacionWizard
          mode="quick"
          relatedDealId={dealId}
          initialClientId={clientId}
          initialLegalName={clientName}
          onDone={() => {
            onSent?.();
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
