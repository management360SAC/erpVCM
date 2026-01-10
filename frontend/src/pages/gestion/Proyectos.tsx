// src/pages/proyectos/Proyectos.tsx
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
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import EventIcon from "@mui/icons-material/Event";
import AppLayout from "../../layout/AppLayout";

// ========== API helpers ==========
async function listProjects(params: {
  page?: number;
  size?: number;
  q?: string;
  status?: string;
}) {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 0));
  qs.set("size", String(params.size ?? 10));
  if (params.q) qs.set("q", params.q);
  if (params.status && params.status !== "TODOS") qs.set("status", params.status);

  const res = await fetch(`/api/projects?${qs.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ========== Tipos mínimos ==========
type ProjectStatus =
  | "PENDIENTE"
  | "EN_EJECUCION"
  | "PAUSADO"
  | "COMPLETADO"
  | "CANCELADO";

type Project = {
  id: number;
  code: string; // PRY-YYYY-0001
  name: string;
  clientName?: string | null;
  ownerName?: string | null; // responsable
  budgetTotal?: number | null;
  progress?: number | null; // 0-100
  status: ProjectStatus;
  startDate?: string | null; // ISO
  endDate?: string | null; // ISO
  createdAt?: string | null;
};

type PageResp<T> = {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
};

// ========== Helpers ==========
const PEN = (v?: number | null) =>
  `S/ ${Number(v || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);
};

const statusChip = (s: ProjectStatus) => {
  const map: Record<
    ProjectStatus,
    {
      color:
        | "default"
        | "primary"
        | "success"
        | "warning"
        | "info"
        | "error";
      label: string;
    }
  > = {
    PENDIENTE: { color: "warning", label: "PENDIENTE" },
    EN_EJECUCION: { color: "success", label: "EN EJECUCIÓN" },
    PAUSADO: { color: "info", label: "PAUSADO" },
    COMPLETADO: { color: "primary", label: "COMPLETADO" },
    CANCELADO: { color: "error", label: "CANCELADO" },
  };
  const { color, label } = map[s] || { color: "default", label: s };
  return <Chip size="small" color={color} variant="outlined" label={label} />;
};

// ========== Vista ==========
export default function Proyectos() {
  // Lista
  const [rows, setRows] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Filtros/paginación
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [status, setStatus] = useState<"TODOS" | ProjectStatus>("TODOS");
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
      const data: PageResp<Project> = await listProjects({
        page,
        size: rowsPerPage,
        q: debouncedQ.trim() || undefined,
        status: status || undefined,
      });
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudieron cargar los proyectos");
      setRows([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Proyectos";
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, debouncedQ, status]);

  // Búsqueda local (por si el API aún no filtra por 'q')
  const filtered = useMemo(() => {
    if (!debouncedQ.trim()) return rows;
    const ql = debouncedQ.toLowerCase();
    return rows.filter((r) => {
      return (
        r.code?.toLowerCase().includes(ql) ||
        r.name?.toLowerCase().includes(ql) ||
        (r.clientName || "").toLowerCase().includes(ql) ||
        (r.ownerName || "").toLowerCase().includes(ql)
      );
    });
  }, [rows, debouncedQ]);

  return (
    <AppLayout title="Proyectos">
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
              Proyectos
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Gestión</Typography>
              <Typography color="text.primary">Proyectos</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* Filtros / acciones */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <TextField
          size="small"
          placeholder="Buscar por código, nombre, cliente o responsable"
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
            <MenuItem value="PAUSADO">Pausado</MenuItem>
            <MenuItem value="COMPLETADO">Completado</MenuItem>
            <MenuItem value="CANCELADO">Cancelado</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => alert("Abrir modal de nuevo proyecto")}>
          Nuevo Proyecto
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
              <TableCell>Proyecto</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Responsable</TableCell>
              <TableCell align="right">Monto total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Inicio</TableCell>
              <TableCell>Fin</TableCell>
              <TableCell width={200}>Avance</TableCell>
              <TableCell align="center" width={110}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={10}>
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
                      <WorkOutlineIcon fontSize="small" />
                      <Box>
                        <Typography fontWeight={700}>{r.code}</Typography>
                        <Typography variant="body2" color="text.secondary" noWrap title={r.name}>
                          {r.name}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>{r.clientName || "—"}</TableCell>
                  <TableCell>{r.ownerName || "—"}</TableCell>

                  <TableCell align="right">
                    <Typography fontWeight={700}>{PEN(r.budgetTotal)}</Typography>
                  </TableCell>

                  <TableCell>{statusChip(r.status)}</TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <EventIcon fontSize="small" />
                      <span>{fmtDate(r.startDate)}</span>
                    </Stack>
                  </TableCell>

                  <TableCell>{fmtDate(r.endDate)}</TableCell>

                  <TableCell>
                    <Stack spacing={0.5}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.max(0, Math.min(100, Number(r.progress || 0)))}
                        sx={{ height: 8, borderRadius: 999 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {Math.round(Number(r.progress || 0))}%
                      </Typography>
                    </Stack>
                  </TableCell>

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
                <TableCell colSpan={10}>
                  <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                    No hay proyectos para mostrar
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
