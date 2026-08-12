// src/pages/operaciones/NpsDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box, Grid, Paper, Stack, Typography, MenuItem, Select, FormControl, InputLabel,
  TextField, Button, Table, TableHead, TableRow, TableCell, TableBody, Pagination,
  CircularProgress, Divider, Chip, Tooltip, Rating
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
import StarIcon from "@mui/icons-material/Star";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartTooltip, ResponsiveContainer, Cell } from "recharts";

const Q_LABELS = [
  "Calidad del servicio",
  "Comunicación y atención",
  "Cumplimiento de plazos",
  "Satisfacción con resultados",
];

function StatCard({ title, value, suffix, help }: { title: string; value: number | string; suffix?: string; help?: string }) {
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

function AvgQuestionCard({ label, avg }: { label: string; avg: number }) {
  return (
    <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3 }}>
      <Typography variant="body2" color="text.secondary" noWrap>{label}</Typography>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
        <Rating
          value={avg}
          max={5}
          precision={0.1}
          readOnly
          size="small"
          icon={<StarIcon fontSize="inherit" sx={{ color: "#ff6b35" }} />}
          emptyIcon={<StarIcon fontSize="inherit" />}
        />
        <Typography variant="h6" fontWeight={700}>{avg.toFixed(1)}</Typography>
      </Stack>
    </Paper>
  );
}

function computeNpsLabel(r: NpsResponse): "Promoter" | "Passive" | "Detractor" {
  const l = (r.label || "").toLowerCase();
  if (l === "promoter" || l === "promotor") return "Promoter";
  if (l === "passive" || l === "pasivo") return "Passive";
  if (l === "detractor") return "Detractor";
  if (r.score >= 9) return "Promoter";
  if (r.score >= 7) return "Passive";
  return "Detractor";
}

function StarCell({ value, max = 5 }: { value?: number; max?: number }) {
  if (value == null) return <Typography variant="caption" color="text.secondary">-</Typography>;
  return (
    <Tooltip title={`${value} / ${max}`}>
      <Stack direction="row" spacing={0.3} alignItems="center">
        <Rating
          value={value}
          max={max}
          readOnly
          size="small"
          icon={<StarIcon fontSize="inherit" sx={{ color: "#ff6b35" }} />}
          emptyIcon={<StarIcon fontSize="inherit" />}
        />
        <Typography variant="caption" fontWeight={600}>{value}</Typography>
      </Stack>
    </Tooltip>
  );
}

export default function NpsDashboard() {
  const [range, setRange] = useState<"30" | "60" | "90">("30");
  const [clientQ, setClientQ] = useState<string>("");
  const [selectedService, setSelectedService] = useState<number | "ALL">("ALL");

  const [summary, setSummary] = useState<NpsSummary | null>(null);
  const [rows, setRows] = useState<NpsResponse[]>([]);
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const calcFilters = (): NpsFilters => {
    const days = parseInt(range, 10);
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days + 1);
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
      serviceId: selectedService !== "ALL" ? selectedService : undefined,
    };
  };

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
      setRows((paged.content || []).map((r) => ({ ...r, label: computeNpsLabel(r) })));
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

  const loadServices = async () => {
    try {
      const data = await getServices({ onlyActive: true });
      setServices(data);
    } catch {
      console.warn("No se pudieron cargar los servicios para el filtro NPS");
    }
  };

  useEffect(() => { loadServices(); }, []);
  useEffect(() => { load(1); }, [range, selectedService]); // eslint-disable-line

  const breakdownData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Detractores", value: summary.detractors, color: "#ef4444" },
      { name: "Pasivos", value: summary.passives, color: "#f59e0b" },
      { name: "Promotores", value: summary.promoters, color: "#22c55e" },
    ];
  }, [summary]);

  const avgData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "P1 Calidad", value: summary.avgQ1 ?? 0 },
      { name: "P2 Atención", value: summary.avgQ2 ?? 0 },
      { name: "P3 Plazos", value: summary.avgQ3 ?? 0 },
      { name: "P4 Resultados", value: summary.avgQ4 ?? 0 },
    ];
  }, [summary]);

  const filteredRows = rows.filter((r) =>
    clientQ ? r.clientName.toLowerCase().includes(clientQ.toLowerCase()) : true
  );

  return (
    <AppLayout title="Encuestas / NPS">
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #fed7aa", background: "#fff7ed" }}>
        <Typography variant="h5" fontWeight={800}>Encuestas / NPS</Typography>
        <Typography variant="body2" color="text.secondary">
          Visualiza la satisfacción de tus clientes basada en 5 preguntas. El envío ocurre automáticamente 1 día después de finalizado el servicio.
        </Typography>
      </Paper>

      {/* Filtros */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <FormControl size="small">
          <InputLabel>Rango</InputLabel>
          <Select value={range} label="Rango" onChange={(e) => setRange(e.target.value as any)} sx={{ minWidth: 140 }}>
            <MenuItem value="30">Últimos 30 días</MenuItem>
            <MenuItem value="60">Últimos 60 días</MenuItem>
            <MenuItem value="90">Últimos 90 días</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Servicio</InputLabel>
          <Select value={selectedService} label="Servicio" onChange={(e) => setSelectedService(e.target.value as any)}>
            <MenuItem value="ALL">Todos</MenuItem>
            {services.map((srv) => (
              <MenuItem key={srv.id} value={srv.id}>{srv.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          size="small" placeholder="Buscar cliente"
          value={clientQ} onChange={(e) => setClientQ(e.target.value)}
          sx={{ minWidth: 200 }}
        />

        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => load(1)} disabled={loading}>
          {loading ? "Cargando..." : "Actualizar"}
        </Button>
      </Stack>

      {err && <Box sx={{ color: "error.main", mb: 1 }}>{err}</Box>}

      {/* KPIs principales */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={6} md={3}>
          <StatCard title="NPS" value={summary?.nps ?? 0} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Tasa de respuesta" value={summary?.responseRate ?? 0} suffix="%" />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="Respondidas" value={summary?.responses ?? 0} help={`de ${summary?.sent ?? 0} enviadas`} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard title="NPS prom." value={summary?.csatAvg ?? 0} help="Promedio pregunta 5 (0-10)" />
        </Grid>
      </Grid>

      {/* Promedios por pregunta */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {Q_LABELS.map((label, idx) => {
          const avg = [summary?.avgQ1, summary?.avgQ2, summary?.avgQ3, summary?.avgQ4][idx] ?? 0;
          return (
            <Grid item xs={6} md={3} key={label}>
              <AvgQuestionCard label={`P${idx + 1}: ${label}`} avg={avg} />
            </Grid>
          );
        })}
      </Grid>

      {/* Gráficas */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3, height: 260 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>Distribución NPS (P5)</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={breakdownData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <RechartTooltip />
                <Bar dataKey="value">
                  {breakdownData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3, height: 260 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>Promedios por pregunta (P1-P4)</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={avgData}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 5]} allowDecimals />
                <RechartTooltip />
                <Bar dataKey="value" fill="#ff6b35" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Breakdown periodo */}
      <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3, mb: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
          <Chip variant="outlined" label={`Desde: ${summary?.periodStart ?? "-"}`} />
          <Chip variant="outlined" label={`Hasta: ${summary?.periodEnd ?? "-"}`} />
          <Divider orientation="vertical" flexItem />
          <Chip label={`Promotores: ${summary?.promoters ?? 0}`} color="success" size="small" />
          <Chip label={`Pasivos: ${summary?.passives ?? 0}`} color="warning" size="small" />
          <Chip label={`Detractores: ${summary?.detractors ?? 0}`} color="error" size="small" />
        </Stack>
      </Paper>

      {/* Tabla de respuestas */}
      <Paper elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3, position: "relative" }}>
        {loading && (
          <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1, bgcolor: "rgba(255,255,255,0.7)" }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <Box sx={{ p: 2, overflowX: "auto" }}>
          <Typography fontWeight={700} sx={{ mb: 1 }}>Respuestas recientes</Typography>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, whiteSpace: "nowrap" } }}>
                <TableCell>Fecha</TableCell>
                <TableCell>Cliente</TableCell>
                <TableCell>Servicio</TableCell>
                <TableCell align="center">P1 Calidad</TableCell>
                <TableCell align="center">P2 Atención</TableCell>
                <TableCell align="center">P3 Plazos</TableCell>
                <TableCell align="center">P4 Resultados</TableCell>
                <TableCell align="center">P5 NPS</TableCell>
                <TableCell align="center">Tipo</TableCell>
                <TableCell>Comentario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{r.createdAt?.slice(0, 10)}</TableCell>
                  <TableCell>{r.clientName}</TableCell>
                  <TableCell>{r.serviceName}</TableCell>
                  <TableCell align="center"><StarCell value={r.q1} /></TableCell>
                  <TableCell align="center"><StarCell value={r.q2} /></TableCell>
                  <TableCell align="center"><StarCell value={r.q3} /></TableCell>
                  <TableCell align="center"><StarCell value={r.q4} /></TableCell>
                  <TableCell align="center"><StarCell value={r.score} max={10} /></TableCell>
                  <TableCell><NpsBadge label={computeNpsLabel(r)} /></TableCell>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography variant="caption" noWrap title={r.comment}>{r.comment || "-"}</Typography>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRows.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={10}>
                    <Box sx={{ py: 5, textAlign: "center", color: "text.secondary" }}>Sin respuestas</Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Stack alignItems="center" sx={{ py: 2 }}>
            <Pagination page={page} count={totalPages} onChange={(_, p) => load(p)} size="small" />
          </Stack>
        </Box>
      </Paper>
    </AppLayout>
  );
}
