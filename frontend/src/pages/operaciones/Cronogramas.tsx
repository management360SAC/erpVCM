// src/pages/cronogramas/Cronogramas.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  FormControl,
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
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";

import AppLayout from "../../layout/AppLayout";

// ======= Tipos =======
type ScheduleStatus =
  | "PENDIENTE"
  | "EN_EJECUCION"
  | "RETRASADO"
  | "COMPLETADO"
  | "CANCELADO";

type Cronograma = {
  id: number;
  code: string; // CRG-YYYY-0001
  projectName: string;
  ownerName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  progress?: number | null;
  status: ScheduleStatus;
  totalTasks?: number | null;
  completedTasks?: number | null;
};

// ======= API helpers =======
async function listSchedules(params: {
  page?: number;
  size?: number;
  q?: string;
  status?: string;
}) {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 0));
  qs.set("size", String(params.size ?? 10));
  if (params.q) qs.set("q", params.q);
  if (params.status && params.status !== "TODOS") qs.set("status", params.status);

  const res = await fetch(`/api/schedules?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ======= Helpers =======
const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);
};

const statusChip = (s: ScheduleStatus) => {
  const map: Record<ScheduleStatus, { color: "default" | "primary" | "success" | "warning" | "error" | "info"; label: string }> =
    {
      PENDIENTE: { color: "warning", label: "Pendiente" },
      EN_EJECUCION: { color: "info", label: "En ejecución" },
      RETRASADO: { color: "error", label: "Retrasado" },
      COMPLETADO: { color: "success", label: "Completado" },
      CANCELADO: { color: "default", label: "Cancelado" },
    };
  const { color, label } = map[s] || { color: "default", label: s };
  return <Chip size="small" color={color} variant="outlined" label={label} />;
};

// ======= Vista principal =======
export default function Cronogramas() {
  const [rows, setRows] = useState<Cronograma[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [status, setStatus] = useState<"TODOS" | ScheduleStatus>("TODOS");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  async function fetchData() {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await listSchedules({
        page,
        size: rowsPerPage,
        q: debouncedQ.trim() || undefined,
        status: status || undefined,
      });
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudieron cargar los cronogramas");
      setRows([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Cronogramas";
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, debouncedQ, status]);

  const filtered = useMemo(() => {
    if (!debouncedQ.trim()) return rows;
    const ql = debouncedQ.toLowerCase();
    return rows.filter((r) =>
      (r.projectName || "").toLowerCase().includes(ql) ||
      (r.ownerName || "").toLowerCase().includes(ql) ||
      (r.code || "").toLowerCase().includes(ql)
    );
  }, [rows, debouncedQ]);

  return (
    <AppLayout title="Cronogramas">
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 3,
          border: "1px solid #eef2f7",
          background: "#eef6ff",
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Cronogramas
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Gestión</Typography>
              <Typography color="text.primary">Cronogramas</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* Filtros / acciones */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <TextField
          size="small"
          placeholder="Buscar por código, proyecto o responsable"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          sx={{ width: 420 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Estado</InputLabel>
          <Select
            label="Estado"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setPage(0);
            }}
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="PENDIENTE">Pendiente</MenuItem>
            <MenuItem value="EN_EJECUCION">En ejecución</MenuItem>
            <MenuItem value="RETRASADO">Retrasado</MenuItem>
            <MenuItem value="COMPLETADO">Completado</MenuItem>
            <MenuItem value="CANCELADO">Cancelado</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>

        <Button variant="contained" startIcon={<AddIcon />} onClick={() => alert("Abrir modal de nuevo cronograma")}>
          Nuevo Cronograma
        </Button>
      </Stack>

      {/* Errores */}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Tabla */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}
      >
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700 } }}>
              <TableCell width={56}>#</TableCell>
              <TableCell>Cronograma</TableCell>
              <TableCell>Proyecto</TableCell>
              <TableCell>Responsable</TableCell>
              <TableCell>Inicio</TableCell>
              <TableCell>Fin</TableCell>
              <TableCell align="center">Progreso</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <CircularProgress size={28} />
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              filtered.map((r, idx) => (
                <TableRow key={r.id} hover>
                  <TableCell>{page * rowsPerPage + idx + 1}</TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EventNoteOutlinedIcon fontSize="small" />
                      <Typography fontWeight={700}>{r.code}</Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>{r.projectName || "—"}</TableCell>
                  <TableCell>{r.ownerName || "—"}</TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarMonthOutlinedIcon fontSize="small" />
                      <span>{fmtDate(r.startDate)}</span>
                    </Stack>
                  </TableCell>

                  <TableCell>{fmtDate(r.endDate)}</TableCell>

                  <TableCell align="center">
                    <Stack spacing={0.5} alignItems="center">
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(0, Math.min(100, Number(r.progress || 0)))}
                        sx={{ height: 8, borderRadius: 999, width: 100 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(Number(r.progress || 0))}%
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell>{statusChip(r.status)}</TableCell>

                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" color="primary" onClick={() => alert(`Ver ${r.code}`)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => alert(`Editar ${r.code}`)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                    No hay cronogramas para mostrar
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 20, 50]}
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
    </AppLayout>
  );
}
