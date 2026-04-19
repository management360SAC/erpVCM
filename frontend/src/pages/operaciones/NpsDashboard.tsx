// src/pages/operaciones/NpsDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box, Grid, Paper, Stack, Typography, MenuItem, Select, FormControl, InputLabel,
  TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, Pagination,
  CircularProgress, Divider, Chip
} from "@mui/material";
import AppLayout from "../../layout/AppLayout";
import {
  fetchNpsResponses,
  fetchNpsSummary,
  type NpsFilters,
  type NpsResponse,
  type NpsSummary,
} from "../../apis/nps";
import { getServices, type ServiceResponse } from "../../apis/service";
import NpsBadge from "../../components/NpsBadge";
import RefreshIcon from "@mui/icons-material/Refresh";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Tarjeta KPI pequeña
function StatCard({
  title, value, suffix, help,
}: { title: string; value: number | string; suffix?: string; help?: string }) {
  return (
    <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3 }}>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      <Typography variant="h4" fontWeight={800}>
        {value}{suffix ? <Typography component="span" variant="h6">{suffix}</Typography> : null}
      </Typography>
      {help && <Typography variant="caption" color="text.secondary">{help}</Typography>}
    </Paper>
  );
}

/** Normaliza/deriva el label NPS para que siempre sea coherente con el score */
function computeNpsLabel(r: NpsResponse): "Promoter" | "Passive" | "Detractor" {
  const l = (r.label || "").toLowerCase();
  if (l === "promoter" || l === "promotor") return "Promoter";
  if (l === "passive"  || l === "pasivo")   return "Passive";
  if (l === "detractor")                    return "Detractor";

  // Fallback por score (regla NPS estándar)
  if (r.score >= 9) return "Promoter";
  if (r.score >= 7) return "Passive";
  return "Detractor";
}

export default function NpsDashboard() {
  // filtros
  const [range, setRange] = useState<"30" | "60" | "90">("30");
  const [clientQ, setClientQ] = useState<string>("");
  const [selectedService, setSelectedService] = useState<number | "ALL">("ALL");

  // datos
  const [summary, setSummary] = useState<NpsSummary | null>(null);
  const [rows, setRows] = useState<NpsResponse[]>([]);
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // estados UI
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /** Helpers fechas */
  const calcFilters = (): NpsFilters => {
    const days = parseInt(range, 10);
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days + 1);
    const toIso = to.toISOString().slice(0, 10);
    const fromIso = from.toISOString().slice(0, 10);
    return { from: fromIso, to: toIso, serviceId: selectedService !== "ALL" ? selectedService : undefined };
  };

  /** Cargar encuestas */
  const load = async (goPage = page) => {
    try {
      setLoading(true);
      setErr(null);

      const filters = calcFilters();

      const [s, paged] = await Promise.all([
        fetchNpsSummary(filters),
        fetchNpsResponses(filters, goPage - 1, size),
      ]);

      setSummary(s);
      // fuerza coherencia de label con score/idioma
      setRows(
        (paged.content || []).map((r) => ({ ...r, label: computeNpsLabel(r) }))
      );
      setTotalPages(paged.totalPages || 1);
      setPage(goPage);
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Error al cargar");
      setRows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  /** Cargar catálogo de servicios */
  const loadServices = async () => {
    try {
      const data = await getServices({ onlyActive: true });
      setServices(data);
    } catch {
      console.warn("No se pudieron cargar los servicios para el filtro NPS");
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, selectedService]);

  /** Datos para la gráfica de distribución */
  const breakdownData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Detractores", value: summary.detractors },
      { name: "Pasivos", value: summary.passives },
      { name: "Promotores", value: summary.promoters },
    ];
  }, [summary]);

  return (
    <AppLayout title="Encuestas / NPS">
      {/* Encabezado */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #fed7aa", background: "#fff7ed" }}>
        <Typography variant="h5" fontWeight={800}>Encuestas / NPS</Typography>
        <Typography variant="body2" color="text.secondary">
          Visualiza el rendimiento del servicio según las respuestas de tus clientes.
        </Typography>
      </Paper>

      {/* Filtros */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
        <FormControl size="small">
          <InputLabel>Rango</InputLabel>
          <Select value={range} label="Rango" onChange={(e) => setRange(e.target.value as any)} sx={{ minWidth: 140 }}>
            <MenuItem value="30">Últimos 30 días</MenuItem>
            <MenuItem value="60">Últimos 60 días</MenuItem>
            <MenuItem value="90">Últimos 90 días</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Filtrar por servicio</InputLabel>
          <Select
            value={selectedService}
            label="Filtrar por servicio"
            onChange={(e) => setSelectedService(e.target.value as number | "ALL")}
          >
            <MenuItem value="ALL">Todos</MenuItem>
            {services.map((srv) => (
              <MenuItem key={srv.id} value={srv.id}>
                {srv.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small"
          placeholder="Buscar cliente"
          value={clientQ}
          onChange={(e) => setClientQ(e.target.value)}
          sx={{ minWidth: 240 }}
        />

        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => load(1)} disabled={loading}>
          {loading ? "Cargando..." : "Actualizar"}
        </Button>
      </Stack>

      {err && <Box sx={{ color: "error.main", mb: 1 }}>{err}</Box>}

      {/* KPIs + Breakdown */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={3}>
          <StatCard title="NPS" value={summary?.nps ?? 0} />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard title="Tasa de respuesta" value={summary?.responseRate ?? 0} suffix="%" />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard title="Respondidas" value={summary?.responses ?? 0} help={`de ${summary?.sent ?? 0} enviadas`} />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard title="CSAT prom." value={summary?.csatAvg ?? 0} />
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3, height: 260 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>Distribución NPS</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={breakdownData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3, height: 260 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>Periodo</Typography>
            <Stack spacing={1}>
              <Chip variant="outlined" label={`Desde: ${summary?.periodStart ?? "-"}`} />
              <Chip variant="outlined" label={`Hasta: ${summary?.periodEnd ?? "-"}`} />
              <Divider />
              <Chip label={`Promotores: ${summary?.promoters ?? 0}`} color="success" />
              <Chip label={`Pasivos: ${summary?.passives ?? 0}`} />
              <Chip label={`Detractores: ${summary?.detractors ?? 0}`} color="error" />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabla de respuestas */}
      <Paper elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3, position: "relative" }}>
        {loading && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <Box sx={{ p: 2 }}>
          <Typography fontWeight={700} sx={{ mb: 1 }}>Respuestas recientes</Typography>
          <Table size="medium" aria-disabled={loading}>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700 } }}>
                <TableCell>Fecha</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Servicio</TableCell>
                <TableCell align="right">Puntaje</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell>Comentario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows
                .filter(r =>
                  (clientQ ? r.clientName.toLowerCase().includes(clientQ.toLowerCase()) : true)
                )
                .map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.createdAt?.slice(0,10)}</TableCell>
                  <TableCell>{r.clientName}</TableCell>
                  <TableCell>{r.serviceName}</TableCell>
                  <TableCell align="right">{r.score}</TableCell>
                  <TableCell><NpsBadge label={computeNpsLabel(r)} /></TableCell>
                  <TableCell>{r.comment || "-"}</TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ py: 5, textAlign: "center", color: "text.secondary" }}>Sin respuestas</Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Stack alignItems="center" sx={{ py: 2 }}>
            <Pagination
              page={page}
              count={totalPages}
              onChange={(_, p) => load(p)}
              size="small"
            />
          </Stack>
        </Box>
      </Paper>
    </AppLayout>
  );
}
