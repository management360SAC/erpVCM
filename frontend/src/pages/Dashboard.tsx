// src/pages/Dashboard.tsx
import { useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import AppLayout from "../layout/AppLayout";

export default function Dashboard() {
  const username = useMemo(() => (localStorage.getItem("username") ?? "admin"), []);
  const ventasPct = 13.79;
  const totalGanado = 5200;

  useEffect(() => { document.title = "Dashboard"; }, []);

  return (
    <AppLayout title="Dashboard" showFilters>
      <Container maxWidth="lg" disableGutters>
        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          Bienvenido, <span style={{ textTransform: "capitalize" }}>{username}</span>
        </Typography>

        <Grid container spacing={2}>
          {/* Card: Monto de Ventas (donut) */}
          <Grid item xs={12} md={6} lg={5}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #eef2f7" }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Monto de Ventas
              </Typography>

              <Box sx={{ position: "relative", display: "inline-flex", m: 1 }}>
                <CircularProgress
                  variant="determinate"
                  value={100}
                  size={180}
                  thickness={5}
                  sx={{ color: "#eef2f7" }}
                />
                <CircularProgress
                  variant="determinate"
                  value={ventasPct}
                  size={180}
                  thickness={5}
                  sx={{ position: "absolute", left: 0 }}
                  color="success"
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  <Typography fontWeight={800} color="success.main">
                    {ventasPct.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monto de Ventas
                  </Typography>
                </Box>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                Total ganado: {totalGanado.toFixed(2)}
              </Typography>
            </Paper>
          </Grid>

          {/* Card: Rubros de Prospectos (barras simples) */}
          <Grid item xs={12} md={6} lg={7}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #eef2f7", height: "100%" }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Rubros de Prospectos
              </Typography>

              <Box sx={{ mt: 1, display: "grid", gap: 1.2 }}>
                {[
                  { label: "Consultoría", v: 80 },
                  { label: "TI & Software", v: 65 },
                  { label: "Finanzas", v: 48 },
                  { label: "Turismo y Hostelería", v: 30 },
                  { label: "Salud y Biotecnología", v: 25 },
                ].map((b) => (
                  <Box key={b.label}>
                    <Typography variant="caption" color="text.secondary">
                      {b.label}
                    </Typography>
                    <Box sx={{ height: 10, bgcolor: "#eef2f7", borderRadius: 5, overflow: "hidden" }}>
                      <Box sx={{ width: `${b.v}%`, height: "100%", bgcolor: "primary.light" }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* KPIs rápidos */}
          <Grid item xs={12} md={4}>
            <KpiCard title="Cantidad de Clientes" value="25">
              <Typography variant="caption" color="text.secondary">Totales: 4 exitosas</Typography>
            </KpiCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <KpiCard title="Tasa de Conversión" value={`${ventasPct.toFixed(2)}%`}>
              <Typography variant="caption" color="text.secondary">Ventas exitosas: 4 / 29</Typography>
            </KpiCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <KpiCard title="Ciclo de Venta" value="0.50 días">
              <Typography variant="caption" color="text.secondary">Promedio</Typography>
            </KpiCard>
          </Grid>

          {/* Franja inferior: Top servicios y estado de propuestas (ejemplo) */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #eef2f7" }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Servicios más vendidos
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip label="Contabilidad" />
                <Chip label="Inventario" />
                <Chip label="Consultoría" />
                <Chip label="Outsourcing Tributario" />
                <Chip label="Peritaje" />
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Actualizado hoy • Meta 2025: S/ 2M
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #eef2f7" }}>
              <Typography fontWeight={700} sx={{ mb: 1 }}>
                Estado de Propuestas
              </Typography>
              <Stack spacing={1}>
                {[
                  { etapa: "Diagnóstico", total: 6, pct: 45 },
                  { etapa: "Propuesta", total: 4, pct: 30 },
                  { etapa: "Negociación", total: 2, pct: 15 },
                  { etapa: "Cerradas", total: 1, pct: 10 },
                ].map((e) => (
                  <Box key={e.etapa}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">{e.etapa}</Typography>
                      <Typography variant="body2" color="text.secondary">{e.total}</Typography>
                    </Stack>
                    <Box sx={{ height: 8, bgcolor: "#eef2f7", borderRadius: 4, overflow: "hidden" }}>
                      <Box sx={{ width: `${e.pct}%`, height: "100%", bgcolor: "secondary.light" }} />
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </AppLayout>
  );
}

/** Card simple para KPIs */
function KpiCard({
  title, value, children,
}: {
  title: string;
  value: string | number;
  children?: React.ReactNode;
}) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #eef2f7" }}>
      <Typography fontWeight={700} sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="h5" fontWeight={800}>
        {value}
      </Typography>
      {children}
    </Paper>
  );
}
