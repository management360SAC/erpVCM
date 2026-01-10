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
  Card,
  CardContent,
  LinearProgress,
} from "@mui/material";
import {
  TrendingUp,
  People,
  Assignment,
  AttachMoney,
  Business,
  CheckCircle,
} from "@mui/icons-material";
import AppLayout from "../layout/AppLayout";
import ServiceExpiryBanner from "../components/ops/ServiceExpiryBanner";

/**
 * Dashboard enfocado a los servicios de la empresa:
 * - Asesoría Fiscal y Laboral
 * - Asesoría en Gestión Contable
 * - Cambio de Estrategias / Crecimiento Empresarial
 * - Auditoría y Peritajes Contables
 * - Optimización de procesos contables / Outsourcing
 * - Control Interno y Gobierno Corporativo
 * - Asesoría en Negocios Familiares
 * - Liquidación Técnica y Financiera de Obras (NIIF)
 */
export default function Dashboard() {
  const username = useMemo(() => localStorage.getItem("username") ?? "admin", []);
  const ventasPct = 62;
  const metaMensual = 200000;
  const totalFacturado = 125000;
  const pendienteCobro = 38000;

  useEffect(() => {
    document.title = "Dashboard - VCM CRM";
  }, []);

  const servicios = [
    "Asesoría Fiscal y Laboral",
    "Asesoría en Gestión Contable",
    "Cambio de Estrategias / Crecimiento Empresarial",
    "Auditoría y Peritajes Contables",
    "Optimización de procesos contables / Outsourcing",
    "Control Interno y Gobierno Corporativo",
    "Asesoría en Negocios Familiares",
    "Liquidación Técnica y Financiera de Obras (NIIF)",
  ];

  const ranking = [
    { label: "Asesoría Fiscal y Laboral", v: 92, count: 18 },
    { label: "Asesoría en Gestión Contable", v: 86, count: 15 },
    { label: "Optimización / Outsourcing", v: 73, count: 12 },
    { label: "Auditoría y Peritajes", v: 65, count: 10 },
    { label: "Control Interno y Gobierno", v: 48, count: 7 },
  ];

  const etapas = [
    { etapa: "Diagnóstico", total: 8, color: "#4caf50" },
    { etapa: "Propuesta", total: 5, color: "#2196f3" },
    { etapa: "Negociación", total: 3, color: "#ff9800" },
    { etapa: "Cerradas", total: 2, color: "#9c27b0" },
  ];

  const kpiData = [
    {
      title: "Clientes activos",
      value: "38",
      subtitle: "En ejecución: 12",
      icon: People,
      color: "#2196f3",
      trend: "+5% vs mes anterior",
    },
    {
      title: "Servicios contratados",
      value: "57",
      subtitle: "Últimos 30 días",
      icon: Assignment,
      color: "#4caf50",
      trend: "+12 este mes",
    },
    {
      title: "Ticket promedio",
      value: "S/ 8,540",
      subtitle: "Promedio mensual",
      icon: AttachMoney,
      color: "#ff9800",
      trend: "+8% vs mes anterior",
    },
    {
      title: "Tasa de cierre",
      value: "67%",
      subtitle: "Conversión leads",
      icon: CheckCircle,
      color: "#9c27b0",
      trend: "Objetivo: 70%",
    },
  ];

  return (
    <AppLayout title="Dashboard" showFilters>
      <ServiceExpiryBanner withinDays={30} />

      <Container maxWidth="xl" disableGutters>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
            Bienvenido, <span style={{ textTransform: "capitalize" }}>{username}</span>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Resumen de operaciones y servicios
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* KPIs principales - 4 columnas */}
          {kpiData.map((kpi, idx) => (
            <Grid item xs={12} sm={6} lg={3} key={idx}>
              <KpiCard {...kpi} />
            </Grid>
          ))}

          {/* Avance de Ventas */}
          <Grid item xs={12} lg={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid #eef2f7",
                height: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <TrendingUp sx={{ color: "success.main" }} />
                <Typography fontWeight={700} variant="h6">
                  Avance de Ventas
                </Typography>
              </Stack>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  flex: 1,
                  position: "relative",
                }}
              >
                <Box sx={{ position: "relative", display: "inline-flex" }}>
                  <CircularProgress
                    variant="determinate"
                    value={100}
                    size={160}
                    thickness={4}
                    sx={{ color: "#eef2f7" }}
                  />
                  <CircularProgress
                    variant="determinate"
                    value={ventasPct}
                    size={160}
                    thickness={4}
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
                    <Typography variant="h3" fontWeight={800} color="success.main">
                      {ventasPct}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Meta mensual
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Facturado
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    S/ {totalFacturado.toLocaleString("es-PE")}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Meta
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    S/ {metaMensual.toLocaleString("es-PE")}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="warning.main">
                    Pendiente cobro
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="warning.main">
                    S/ {pendienteCobro.toLocaleString("es-PE")}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          </Grid>

          {/* Ranking de servicios */}
          <Grid item xs={12} lg={8}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid #eef2f7",
                height: "100%",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Business sx={{ color: "primary.main" }} />
                <Typography fontWeight={700} variant="h6">
                  Servicios con mayor demanda
                </Typography>
              </Stack>

              <Stack spacing={2.5}>
                {ranking.map((item) => (
                  <Box key={item.label}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {item.label}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          {item.count} servicios
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          {item.v}%
                        </Typography>
                      </Stack>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={item.v}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#eef2f7",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 4,
                          background: `linear-gradient(90deg, #1976d2 0%, #42a5f5 100%)`,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>

          {/* Pipeline Comercial */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid #eef2f7",
                height: "100%",
              }}
            >
              <Typography fontWeight={700} variant="h6" sx={{ mb: 2 }}>
                Pipeline Comercial
              </Typography>
              <Stack spacing={2}>
                {etapas.map((e) => (
                  <Box key={e.etapa}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {e.etapa}
                      </Typography>
                      <Chip
                        label={e.total}
                        size="small"
                        sx={{
                          bgcolor: e.color,
                          color: "white",
                          fontWeight: 600,
                          minWidth: 40,
                        }}
                      />
                    </Stack>
                    <Box
                      sx={{
                        height: 6,
                        bgcolor: "#eef2f7",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${(e.total / 8) * 100}%`,
                          height: "100%",
                          bgcolor: e.color,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Total en pipeline: 18 oportunidades • Valor estimado: S/ 450,000
              </Typography>
            </Paper>
          </Grid>

          {/* Portafolio de Servicios */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid #eef2f7",
                height: "100%",
              }}
            >
              <Typography fontWeight={700} variant="h6" sx={{ mb: 2 }}>
                Portafolio de Servicios
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                {servicios.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    variant="outlined"
                    sx={{
                      borderRadius: 2,
                      fontWeight: 500,
                      "&:hover": {
                        bgcolor: "primary.light",
                        borderColor: "primary.main",
                        color: "primary.main",
                      },
                    }}
                  />
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>8 servicios principales</strong> • Enfoque en calidad, cumplimiento NIIF y
                optimización operativa
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </AppLayout>
  );
}

/** Card mejorado para KPIs con iconos y colores */
function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  trend: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2,
        border: "1px solid #eef2f7",
        height: "100%",
        transition: "all 0.3s ease",
        "&:hover": {
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Box
            sx={{
              bgcolor: `${color}15`,
              borderRadius: 2,
              p: 0.75,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon sx={{ fontSize: 20, color }} />
          </Box>
        </Stack>

        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
          {value}
        </Typography>

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          {subtitle}
        </Typography>

        <Typography variant="caption" sx={{ color, fontWeight: 500 }}>
          {trend}
        </Typography>
      </CardContent>
    </Card>
  );
}