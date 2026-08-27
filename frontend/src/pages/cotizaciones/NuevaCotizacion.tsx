// src/pages/cotizaciones/NuevaCotizacion.tsx
import { Avatar, Box, Breadcrumbs, Paper, Stack, Typography } from "@mui/material";
import AppLayout from "../../layout/AppLayout";
import CotizacionWizard from "./CotizacionWizard";

export default function NuevaCotizacion() {
  return (
    <AppLayout title="">
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 3, borderRadius: 3, border: "1px solid #eef2f7", background: "#eef6ff" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>Nueva Cotización</Typography>
            <Breadcrumbs sx={{ mt: .5 }}>
              <Typography color="text.secondary">Cotizaciones</Typography>
              <Typography color="text.primary">Nueva Cotización</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      <CotizacionWizard mode="full" />
    </AppLayout>
  );
}
