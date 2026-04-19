// src/pages/reportes/Proyecciones.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import AppLayout from "../../layout/AppLayout";
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RTooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import {
  getManualProjections,
  upsertManualProjection,
  deleteManualProjection,
  type ManualProjection,
} from "../../apis/proyecciones";

type ProjectionPoint = {
  x: string;
  base: number;
  optimista: number;
  pesimista: number;
  real?: number;
};

type ProjectionRow = {
  month: string;
  base: number;
  optimista: number;
  pesimista: number;
  hasManual: boolean;
  real?: number;
  diferencia?: number;
  pctCumplimiento?: number;
};

type ProjResp = {
  horizon: number;
  series: ProjectionPoint[];
  table: ProjectionRow[];
  totalBase: number;
};

const PEN = (v: number) =>
  `S/ ${Number(v || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MONTHS_ES = [
  "", "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Set", "Oct", "Nov", "Dic",
];

const currentYear = new Date().getFullYear();

async function fetchProjections(h: number): Promise<ProjResp> {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const r = await fetch(`/api/analytics/projections?horizon=${h}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function Proyecciones() {
  const [horizon, setHorizon] = useState(6);
  const [data, setData] = useState<ProjResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Manual projections
  const [manuals, setManuals] = useState<ManualProjection[]>([]);
  const [manualYear, setManualYear] = useState(currentYear);
  const [loadingManual, setLoadingManual] = useState(false);

  // Dialog: add/edit manual projection
  const [dlgOpen, setDlgOpen] = useState(false);
  const [dlgMonth, setDlgMonth] = useState<number | null>(null);
  const [dlgAmount, setDlgAmount] = useState("");
  const [dlgSaving, setDlgSaving] = useState(false);
  const [dlgError, setDlgError] = useState("");

  // Table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rows = data?.table || [];
  const paged = useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage]
  );

  async function loadProjections(h: number) {
    try {
      setLoading(true);
      setErrorMsg("");
      const d = await fetchProjections(h);
      setData(d);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudieron cargar las proyecciones");
    } finally {
      setLoading(false);
    }
  }

  async function loadManuals(year: number) {
    try {
      setLoadingManual(true);
      const data = await getManualProjections(year);
      setManuals(data);
    } catch {
      // noop
    } finally {
      setLoadingManual(false);
    }
  }

  useEffect(() => {
    document.title = "Proyecciones";
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) return;
    loadProjections(horizon);
    loadManuals(manualYear);
  }, []);

  useEffect(() => {
    loadProjections(horizon);
  }, [horizon]);

  useEffect(() => {
    loadManuals(manualYear);
  }, [manualYear]);

  function openAddDialog(month: number | null = null) {
    setDlgMonth(month);
    const existing = manuals.find(m => m.month === month);
    setDlgAmount(existing ? String(existing.amount) : "");
    setDlgError("");
    setDlgOpen(true);
  }

  async function handleSaveProjection() {
    const amount = parseFloat(dlgAmount);
    if (!amount || amount <= 0) {
      setDlgError("El monto debe ser mayor a 0.");
      return;
    }
    try {
      setDlgSaving(true);
      setDlgError("");
      await upsertManualProjection({ year: manualYear, month: dlgMonth, amount });
      setDlgOpen(false);
      await loadManuals(manualYear);
      await loadProjections(horizon);
    } catch (e: any) {
      setDlgError(e?.message || "No se pudo guardar la proyección.");
    } finally {
      setDlgSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("¿Eliminar esta proyección manual?")) return;
    await deleteManualProjection(id);
    await loadManuals(manualYear);
    await loadProjections(horizon);
  }

  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <AppLayout title="Proyecciones">
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #fed7aa", background: "#fff7ed" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>Proyecciones</Typography>
            <Breadcrumbs sx={{ mt: .5 }}>
              <Typography color="text.secondary">Reportes & Analítica</Typography>
              <Typography color="text.primary">Proyecciones</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* Sección: Proyecciones Manuales */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #eef2f7" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Metas manuales</Typography>
            <Typography variant="body2" color="text.secondary">
              Define la meta de ingreso mensual. Se usará como referencia en el gráfico y en el dashboard.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Año</InputLabel>
              <Select label="Año" value={manualYear} onChange={e => setManualYear(Number(e.target.value))}>
                {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => openAddDialog(null)}>
              Meta anual
            </Button>
          </Stack>
        </Stack>

        {loadingManual ? (
          <LinearProgress />
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {monthOptions.map(m => {
              const existing = manuals.find(mp => mp.month === m);
              return (
                <Paper
                  key={m}
                  variant="outlined"
                  sx={{
                    px: 1.5, py: 1, borderRadius: 2, minWidth: 110,
                    borderColor: existing ? "primary.light" : "divider",
                    bgcolor: existing ? "rgba(25,118,210,0.04)" : "transparent",
                    cursor: "pointer",
                    "&:hover": { borderColor: "primary.main", boxShadow: 1 },
                  }}
                  onClick={() => openAddDialog(m)}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {MONTHS_ES[m]} {manualYear}
                  </Typography>
                  {existing ? (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {PEN(existing.amount)}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={e => { e.stopPropagation(); handleDelete(existing.id); }}
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.disabled">Sin meta</Typography>
                  )}
                </Paper>
              );
            })}

            {/* Proyección anual */}
            {(() => {
              const annual = manuals.find(mp => mp.month === null);
              return (
                <Paper
                  variant="outlined"
                  sx={{
                    px: 1.5, py: 1, borderRadius: 2, minWidth: 140,
                    borderColor: annual ? "success.light" : "divider",
                    bgcolor: annual ? "rgba(76,175,80,0.04)" : "transparent",
                    cursor: "pointer",
                    "&:hover": { borderColor: "success.main", boxShadow: 1 },
                  }}
                  onClick={() => openAddDialog(null)}
                >
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Anual {manualYear}
                  </Typography>
                  {annual ? (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight={700} color="success.main">
                        {PEN(annual.amount)}
                      </Typography>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={e => { e.stopPropagation(); handleDelete(annual.id); }}
                      >
                        <DeleteIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="text.disabled">Sin meta</Typography>
                  )}
                </Paper>
              );
            })()}
          </Box>
        )}
      </Paper>

      {/* Selector de horizonte */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Horizonte</InputLabel>
          <Select label="Horizonte" value={horizon} onChange={e => { setHorizon(Number(e.target.value)); setPage(0); }}>
            <MenuItem value={3}>3 meses</MenuItem>
            <MenuItem value={6}>6 meses</MenuItem>
            <MenuItem value={12}>12 meses</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => loadProjections(horizon)} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
      </Stack>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* Gráfico */}
          <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #eef2f7", borderRadius: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Typography fontWeight={700}>Proyección de Ingresos</Typography>
              <Chip size="small" label="Línea azul = meta" color="primary" variant="outlined" />
              <Chip size="small" label="Verde = real cobrado" color="success" variant="outlined" />
            </Stack>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.series || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis tickFormatter={v => `S/${(v/1000).toFixed(0)}k`} />
                <RTooltip formatter={(v) => PEN(Number(v))} />
                <Legend />
                <Area type="monotone" dataKey="base" name="Meta" stroke="#1976d2" fill="#e3f2fd" strokeWidth={2} />
                <Area type="monotone" dataKey="optimista" name="Optimista" stroke="#4caf50" fill="none" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="pesimista" name="Pesimista" stroke="#ff9800" fill="none" strokeDasharray="5 5" />
                <Area type="monotone" dataKey="real" name="Real cobrado" stroke="#2e7d32" fill="#c8e6c9" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>

          {/* Tabla */}
          <Paper elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow sx={{ "& th": { fontWeight: 700 } }}>
                    <TableCell>Mes</TableCell>
                    <TableCell align="right">Meta</TableCell>
                    <TableCell align="right">Optimista</TableCell>
                    <TableCell align="right">Pesimista</TableCell>
                    <TableCell align="right">Real cobrado</TableCell>
                    <TableCell align="right">Diferencia</TableCell>
                    <TableCell align="right">% Cumpl.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((r, i) => {
                    const hasPct = r.pctCumplimiento !== undefined;
                    const pctVal = r.pctCumplimiento ?? 0;
                    const pctColor = pctVal >= 100 ? "success" : pctVal >= 60 ? "warning" : "error";
                    return (
                      <TableRow key={i} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="body2">{r.month}</Typography>
                            {r.hasManual && <Chip size="small" label="manual" color="info" variant="outlined" />}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{PEN(r.base)}</TableCell>
                        <TableCell align="right" sx={{ color: "text.secondary" }}>{PEN(r.optimista)}</TableCell>
                        <TableCell align="right" sx={{ color: "text.secondary" }}>{PEN(r.pesimista)}</TableCell>
                        <TableCell align="right">
                          {r.real !== undefined ? (
                            <Typography fontWeight={700} color="success.main">{PEN(r.real)}</Typography>
                          ) : "—"}
                        </TableCell>
                        <TableCell align="right">
                          {r.diferencia !== undefined ? (
                            <Typography fontWeight={700} color={r.diferencia >= 0 ? "success.main" : "error.main"}>
                              {r.diferencia >= 0 ? "+" : ""}{PEN(r.diferencia)}
                            </Typography>
                          ) : "—"}
                        </TableCell>
                        <TableCell align="right">
                          {hasPct ? (
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "flex-end" }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(100, pctVal)}
                                color={pctColor}
                                sx={{ width: 48, height: 6, borderRadius: 3 }}
                              />
                              <Typography variant="caption" fontWeight={700}>
                                {pctVal.toFixed(1)}%
                              </Typography>
                            </Box>
                          ) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No hay datos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              rowsPerPageOptions={[10, 20, 50]}
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              labelRowsPerPage="Filas:"
            />
          </Paper>
        </>
      )}

      {/* Dialog: agregar/editar proyección manual */}
      <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)} fullWidth maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {dlgMonth ? `Meta de ${MONTHS_ES[dlgMonth]} ${manualYear}` : `Meta anual ${manualYear}`}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {dlgMonth === null && (
              <Alert severity="info">
                La meta anual se divide entre 12 meses como fallback si no hay meta mensual.
              </Alert>
            )}
            <TextField
              label="Monto proyectado (S/)"
              type="number"
              value={dlgAmount}
              onChange={e => setDlgAmount(e.target.value)}
              fullWidth
              required
              inputProps={{ min: "0.01", step: "0.01" }}
              InputProps={{
                startAdornment: <InputAdornment position="start">S/</InputAdornment>,
              }}
            />
            {dlgError && <Alert severity="error">{dlgError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDlgOpen(false)} disabled={dlgSaving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveProjection} disabled={dlgSaving || !dlgAmount}>
            {dlgSaving ? <CircularProgress size={18} /> : "Guardar meta"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
