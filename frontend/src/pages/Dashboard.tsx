// src/pages/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  People,
  Assignment,
  AttachMoney,
  CheckCircle,
  Business,
  WarningAmber,
} from "@mui/icons-material";
import RefreshIcon from "@mui/icons-material/Refresh";
import AppLayout from "../layout/AppLayout";
import ServiceExpiryBanner from "../components/ops/ServiceExpiryBanner";
import { getDashboardSummary, type DashboardSummary } from "../apis/dashboard";

const PEN = (v: number) =>
  `S/ ${Number(v || 0).toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const PCT = (v: number) => `${Number(v || 0).toFixed(1)}%`;

const MONTHS_ES = [
  "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function Dashboard() {
  const username = useMemo(() => localStorage.getItem("username") ?? "admin", []);
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try {
      setLoading(true);
      setError("");
      const d = await getDashboardSummary();
      setData(d);
    } catch {
      setError("No se pudo cargar el resumen. Verifica la conexión.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Dashboard - VCM CRM";
    load();
  }, []);

  const pct = data?.pctCumplimiento ?? 0;
  const pctColor = pct >= 100 ? "success" : pct >= 60 ? "warning" : "error";
  const pctBg    = pct >= 100 ? "#dcfce7" : pct >= 60 ? "#fff7ed" : "#fee2e2";

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

  return (
    <AppLayout title="Dashboard" showFilters>
      <ServiceExpiryBanner withinDays={30} />

      <Container maxWidth="xl" disableGutters>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
              Bienvenido, <span style={{ textTransform: "capitalize" }}>{username}</span>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {data ? `${MONTHS_ES[data.month]} ${data.year} — datos en tiempo real` : "Cargando datos..."}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={load}
            disabled={loading}
          >
            Actualizar
          </Button>
        </Stack>

        {error && (
          <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, border: "1px solid #fca5a5", bgcolor: "#fff1f2" }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        )}

        <Grid container spacing={3}>
          {/* KPI: Clientes */}
          <Grid item xs={12} sm={6} lg={3}>
            <KpiCard
              title="Clientes registrados"
              value={loading ? "—" : String(data?.totalClientes ?? 0)}
              subtitle={`En ejecución: ${data?.serviciosActivos ?? 0}`}
              icon={People}
              color="#2196f3"
              trend="Total activo"
              loading={loading}
            />
          </Grid>

          {/* KPI: Servicios activos */}
          <Grid item xs={12} sm={6} lg={3}>
            <KpiCard
              title="Servicios en ejecución"
              value={loading ? "—" : String(data?.serviciosActivos ?? 0)}
              subtitle="Estado: EN_EJECUCION"
              icon={Assignment}
              color="#4caf50"
              trend="Actualmente activos"
              loading={loading}
            />
          </Grid>

          {/* KPI: Cobrado este mes */}
          <Grid item xs={12} sm={6} lg={3}>
            <KpiCard
              title="Cobrado este mes"
              value={loading ? "—" : PEN(data?.mrrReal ?? 0)}
              subtitle={`Facturado: ${PEN(data?.totalFacturadoMes ?? 0)}`}
              icon={AttachMoney}
              color="#ff9800"
              trend={`Pendiente cobro: ${PEN(data?.pendienteCobro ?? 0)}`}
              loading={loading}
            />
          </Grid>

          {/* KPI: Tasa de cierre */}
          <Grid item xs={12} sm={6} lg={3}>
            <KpiCard
              title="Tasa de cierre"
              value={loading ? "—" : PCT(data?.tasaCierre ?? 0)}
              subtitle="Deals WON vs LOST (90 días)"
              icon={CheckCircle}
              color="#9c27b0"
              trend={`Pipeline: ${PEN(data?.pipelineValue ?? 0)}`}
              loading={loading}
            />
          </Grid>

          {/* Avance de Ventas (real vs proyectado) */}
          <Grid item xs={12} lg={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3, borderRadius: 2, border: "1px solid #eef2f7",
                height: "100%", display: "flex", flexDirection: "column",
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                {pct >= 100 ? (
                  <TrendingUp sx={{ color: "success.main" }} />
                ) : (
                  <TrendingDown sx={{ color: pct >= 60 ? "warning.main" : "error.main" }} />
                )}
                <Typography fontWeight={700} variant="h6">Avance del Mes</Typography>
                {data?.hasManualProjection && (
                  <Chip size="small" label="Meta manual" color="info" variant="outlined" />
                )}
              </Stack>

              {loading ? (
                <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1, flexDirection: "column", gap: 2 }}>
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
                      value={Math.min(100, pct)}
                      size={160}
                      thickness={4}
                      color={pctColor}
                      sx={{ position: "absolute", left: 0 }}
                    />
                    <Box sx={{
                      position: "absolute", inset: 0, display: "flex",
                      alignItems: "center", justifyContent: "center", flexDirection: "column",
                    }}>
                      <Typography variant="h4" fontWeight={800} color={`${pctColor}.main`}>
                        {PCT(pct)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">cumplido</Typography>
                    </Box>
                  </Box>

                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: pctBg, width: "100%" }}>
                    <Stack spacing={0.75}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Cobrado</Typography>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          {PEN(data?.mrrReal ?? 0)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Meta mensual</Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {PEN(data?.mrrProjected ?? 0)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Diferencia</Typography>
                        <Typography
                          variant="body2" fontWeight={700}
                          color={(data?.mrrReal ?? 0) >= (data?.mrrProjected ?? 0) ? "success.main" : "warning.main"}
                        >
                          {PEN((data?.mrrReal ?? 0) - (data?.mrrProjected ?? 0))}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="warning.main">Pendiente cobro</Typography>
                        <Typography variant="body2" fontWeight={700} color="warning.main">
                          {PEN(data?.pendienteCobro ?? 0)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Leads & Pipeline */}
          <Grid item xs={12} lg={4}>
            <Paper
              elevation={0}
              sx={{ p: 3, borderRadius: 2, border: "1px solid #eef2f7", height: "100%" }}
            >
              <Typography fontWeight={700} variant="h6" sx={{ mb: 2 }}>Pipeline & Leads</Typography>
              {loading ? (
                <Stack spacing={2}>{[1,2,3].map(i => <Skeleton key={i} height={40} />)}</Stack>
              ) : (
                <Stack spacing={2.5}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2">Pipeline abierto</Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {PEN(data?.pipelineValue ?? 0)}
                      </Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={Math.min(100, (data?.pipelineValue ?? 0) / 5000)}
                      sx={{ height: 6, borderRadius: 3, bgcolor: "#eef2f7" }} />
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2">Leads (últimos 30 días)</Typography>
                      <Typography variant="body2" fontWeight={700} color="info.main">
                        {data?.totalLeads30d ?? 0} leads
                      </Typography>
                    </Stack>
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2">Tasa de cierre (90 días)</Typography>
                      <Typography variant="body2" fontWeight={700}
                        color={(data?.tasaCierre ?? 0) >= 50 ? "success.main" : "warning.main"}>
                        {PCT(data?.tasaCierre ?? 0)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, data?.tasaCierre ?? 0)}
                      color={(data?.tasaCierre ?? 0) >= 50 ? "success" : "warning"}
                      sx={{ height: 6, borderRadius: 3, bgcolor: "#eef2f7" }} />
                  </Box>

                  <Divider />

                  <Stack direction="row" spacing={2}>
                    <Paper variant="outlined" sx={{ flex: 1, p: 1.5, textAlign: "center", borderRadius: 2 }}>
                      <Typography variant="h5" fontWeight={800} color="primary.main">
                        {data?.totalClientes ?? 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Clientes</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ flex: 1, p: 1.5, textAlign: "center", borderRadius: 2 }}>
                      <Typography variant="h5" fontWeight={800} color="success.main">
                        {data?.serviciosActivos ?? 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">En ejecución</Typography>
                    </Paper>
                  </Stack>
                </Stack>
              )}
            </Paper>
          </Grid>

          {/* Portafolio de Servicios */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: "1px solid #eef2f7", height: "100%" }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                <Business sx={{ color: "primary.main" }} />
                <Typography fontWeight={700} variant="h6">Portafolio de Servicios</Typography>
              </Stack>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {servicios.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    variant="outlined"
                    size="small"
                    sx={{
                      borderRadius: 2, fontWeight: 500,
                      "&:hover": { bgcolor: "primary.light", borderColor: "primary.main", color: "primary.main" },
                    }}
                  />
                ))}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                <strong>8 servicios principales</strong> · Enfoque en NIIF, cumplimiento fiscal y optimización
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </AppLayout>
  );
}

function KpiCard({
  title, value, subtitle, icon: Icon, color, trend, loading,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  trend: string;
  loading?: boolean;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 2, border: "1px solid #eef2f7", height: "100%",
        transition: "all 0.2s ease",
        "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.08)", transform: "translateY(-2px)" },
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>{title}</Typography>
          <Box sx={{ bgcolor: `${color}15`, borderRadius: 2, p: 0.75, display: "flex" }}>
            <Icon sx={{ fontSize: 20, color }} />
          </Box>
        </Stack>

        {loading ? (
          <Skeleton variant="text" width="60%" height={40} />
        ) : (
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>{value}</Typography>
        )}

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
          {subtitle}
        </Typography>
        <Typography variant="caption" sx={{ color, fontWeight: 500 }}>{trend}</Typography>
      </CardContent>
    </Card>
  );
}
