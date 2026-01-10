// frontend/src/components/ops/ServiceExpiryBanner.tsx
import { useEffect, useState } from "react";
import { Alert, AlertTitle, Button, Stack } from "@mui/material";
import { getTrackingSummary, type ServiceTrackingSummary } from "../../apis/serviceTracking";
import { useNavigate } from "react-router-dom";

export default function ServiceExpiryBanner({ withinDays = 30 }) {
  const nav = useNavigate();
  const [sum, setSum] = useState<ServiceTrackingSummary | null>(null);

  useEffect(() => {
    getTrackingSummary(withinDays).then(setSum).catch(() => setSum(null));
  }, [withinDays]);

  if (!sum) return null;
  const show = sum.expiringSoon > 0 || sum.expired > 0;
  if (!show) return null;

  return (
    <Alert severity={sum.expired > 0 ? "error" : "warning"} sx={{ mb: 2 }}>
      <AlertTitle>Seguimiento de Servicios</AlertTitle>
      {sum.expired > 0 && <span><b>{sum.expired}</b> servicio(s) <b>vencidos</b>. </span>}
      {sum.expiringSoon > 0 && <span><b>{sum.expiringSoon}</b> por vencer en {sum.windowDays} días. </span>}
      <Stack direction="row" spacing={1} sx={{ mt: .5 }}>
        <Button size="small" variant="outlined" onClick={() => nav("/operaciones/seguimiento")}>
          Ver detalle
        </Button>
      </Stack>
    </Alert>
  );
}
