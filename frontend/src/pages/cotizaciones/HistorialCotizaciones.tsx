// src/pages/cotizaciones/HistorialCotizaciones.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import EventIcon from "@mui/icons-material/Event";
import ListAltIcon from "@mui/icons-material/ListAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

import AppLayout from "../../layout/AppLayout";

/* ================= Tipos que mapean al backend ================= */
type QuoteStatus = "BORRADOR" | "ENVIADA" | "APROBADA" | "RECHAZADA";

interface QuoteApi {
  id: number;
  number: string;
  clientId: number;
  sector: "PRIVADO" | "PUBLICO";
  status: QuoteStatus;
  subTotal: number;
  igv: number;
  total: number;
  validUntil?: string | null;
  createdAt: string;
  fileUrl?: string | null;
  fileSize?: number | null;
}

interface QuoteItemApi {
  id?: number;
  serviceId?: number;
  name: string;
  cost: number;
}

/* ================= Helpers ================= */
const PEN = (v: number) =>
  `S/ ${Number(v || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Robusto para cadenas "YYYY-MM-DD" (evita desfases por zona horaria)
const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString("es-PE");
  }
  return new Date(d).toLocaleDateString("es-PE");
};

const toInputDate = (d?: string | null) => {
  if (!d) return "";
  // Entrada segura YYYY-MM-DD para <input type="date">
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const getEstadoColor = (
  estado: QuoteStatus
): "default" | "warning" | "info" | "success" | "error" => {
  switch (estado) {
    case "BORRADOR":
      return "default";
    case "ENVIADA":
      return "info";
    case "APROBADA":
      return "success";
    case "RECHAZADA":
      return "error";
    default:
      return "default";
  }
};

export default function HistorialCotizaciones() {
  const nav = useNavigate();

  /* ================= Estado UI principal ================= */
  const [rows, setRows] = useState<QuoteApi[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  /* ================= Filtros ================= */
  const [searchQuery, setSearchQuery] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("TODOS");
  const [sectorFiltro, setSectorFiltro] = useState<string>("TODOS");

  /* ================= Paginación ================= */
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  /* ================= Debounce búsqueda ================= */
  const [debouncedQ, setDebouncedQ] = useState(searchQuery);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  /* ================= Auth + título ================= */
  useEffect(() => {
    document.title = "Historial de Cotizaciones";
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) {
      nav("/login");
      return;
    }
  }, [nav]);

  /* ================= Cargar datos ================= */
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");

      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) throw new Error("Sesión expirada");

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("size", String(rowsPerPage));
      if (estadoFiltro !== "TODOS") params.set("status", estadoFiltro);
      if (debouncedQ.trim() !== "") params.set("q", debouncedQ.trim());

      // GET /api/quotes?page=&size=&status=&q=
      const res = await fetch(`/api/quotes?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Error ${res.status}`);
      }

      const data: {
        content: QuoteApi[] | any[];
        totalElements: number;
        number: number;
        size: number;
      } = await res.json();

      // Normalización de claves de vigencia
      const rawRows = data.content || [];
      const normalizedRows: QuoteApi[] = rawRows.map((q: any) => ({
        ...q,
        validUntil:
          q.validUntil ??
          q.valid_until ??
          q.validUntilDate ??
          q.validityDate ??
          q.meta?.validUntil ??
          null,
      }));

      setRows(normalizedRows);
      setTotalElements(data.totalElements || 0);
    } catch (e: any) {
      setErrorMsg(e?.message || "Error cargando cotizaciones");
      setRows([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, estadoFiltro, debouncedQ]);

  /* ================= Filtrado por sector en cliente ================= */
  const filteredRows = useMemo(() => {
    if (sectorFiltro === "TODOS") return rows;
    return rows.filter((r) => r.sector === sectorFiltro);
  }, [rows, sectorFiltro]);

  /* ================= Modal: Servicios de la cotización ================= */
  const [svcOpen, setSvcOpen] = useState(false);
  const [svcLoading, setSvcLoading] = useState(false);
  const [svcItems, setSvcItems] = useState<QuoteItemApi[]>([]);
  const [svcQuote, setSvcQuote] = useState<{ id: number; number: string } | null>(null);

  const fetchQuoteItems = async (quoteId: number) => {
    try {
      setSvcLoading(true);
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) throw new Error("Sesión expirada");

      const res = await fetch(`/api/quotes/${quoteId}/items`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Error ${res.status}`);
      }
      const data: QuoteItemApi[] = await res.json();
      setSvcItems(data || []);
    } catch (e) {
      console.error(e);
      setSvcItems([]);
    } finally {
      setSvcLoading(false);
    }
  };

  const handleOpenServicios = (row: QuoteApi) => {
    setSvcQuote({ id: row.id, number: row.number });
    setSvcItems([]);
    setSvcOpen(true);
    fetchQuoteItems(row.id);
  };

  const svcSubtotal = useMemo(
    () => svcItems.reduce((acc, it) => acc + Number(it.cost || 0), 0),
    [svcItems]
  );
  const svcIgv = useMemo(() => svcSubtotal * 0.18, [svcSubtotal]);
  const svcTotal = useMemo(() => svcSubtotal + svcIgv, [svcSubtotal, svcIgv]);

  /* ================= Modal: Editar vigencia (validUntil) ================= */
  const [vigOpen, setVigOpen] = useState(false);
  const [vigLoading, setVigLoading] = useState(false);
  const [vigRow, setVigRow] = useState<QuoteApi | null>(null);
  const [vigDate, setVigDate] = useState<string>("");

  const handleOpenVigencia = (row: QuoteApi) => {
    setVigRow(row);
    setVigDate(toInputDate(row.validUntil));
    setVigOpen(true);
  };

  const updateVigencia = async () => {
    if (!vigRow) return;
    try {
      setVigLoading(true);
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) throw new Error("Sesión expirada");

      const res = await fetch(`/api/quotes/${vigRow.id}/valid-until`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ validUntil: vigDate || null }),
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Error ${res.status}`);
      }

      setVigOpen(false);
      fetchData();
    } catch (e: any) {
      alert(e?.message || "No se pudo actualizar la vigencia.");
    } finally {
      setVigLoading(false);
    }
  };

  /* ================= Modal: Aprobar cotización ================= */
  const [approveOpen, setApproveOpen] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [approveRow, setApproveRow] = useState<QuoteApi | null>(null);
  const [approveReason, setApproveReason] = useState("");

  const handleOpenApprove = (row: QuoteApi) => {
    setApproveRow(row);
    setApproveReason("");
    setApproveOpen(true);
  };

  const handleApproveQuote = async () => {
    if (!approveRow) return;
    
    // Validar que esté en estado ENVIADA
    if (approveRow.status !== "ENVIADA") {
      alert("Solo se pueden aprobar cotizaciones en estado ENVIADA");
      return;
    }

    try {
      setApproveLoading(true);
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) throw new Error("Sesión expirada");

      const res = await fetch(`/api/quotes/${approveRow.id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: approveReason || "Aprobada desde el sistema",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      // Esperar 5 segundos antes de cerrar y actualizar
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      setApproveOpen(false);
      fetchData(); // Refrescar la tabla
    } catch (e: any) {
      alert(e?.message || "No se pudo aprobar la cotización.");
    } finally {
      setApproveLoading(false);
    }
  };

  /* ================= Modal: Rechazar cotización ================= */
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectRow, setRejectRow] = useState<QuoteApi | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const handleOpenReject = (row: QuoteApi) => {
    setRejectRow(row);
    setRejectReason("");
    setRejectOpen(true);
  };

  const handleRejectQuote = async () => {
    if (!rejectRow) return;
    
    // Validar que esté en estado ENVIADA
    if (rejectRow.status !== "ENVIADA") {
      alert("Solo se pueden rechazar cotizaciones en estado ENVIADA");
      return;
    }

    if (!rejectReason.trim()) {
      alert("Debe proporcionar un motivo para rechazar la cotización");
      return;
    }

    try {
      setRejectLoading(true);
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      if (!token) throw new Error("Sesión expirada");

      const res = await fetch(`/api/quotes/${rejectRow.id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Error ${res.status}`);
      }

      // Esperar 5 segundos antes de cerrar y actualizar
      await new Promise(resolve => setTimeout(resolve, 5000));

      setRejectOpen(false);
      fetchData(); // Refrescar la tabla
    } catch (e: any) {
      alert(e?.message || "No se pudo rechazar la cotización.");
    } finally {
      setRejectLoading(false);
    }
  };

  /* ================= Handlers paginación ================= */
  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  return (
    <AppLayout title="">
      {/* Encabezado */}
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
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Historial de Cotizaciones
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Cotizaciones</Typography>
              <Typography color="text.primary">Historial</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* Barra de acciones */}
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
        <TextField
          placeholder="Buscar por número o clienteId"
          size="small"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 320 }}
        />

        <FormControl size="small">
          <InputLabel>Estado</InputLabel>
          <Select
            value={estadoFiltro}
            label="Estado"
            onChange={(e) => {
              setEstadoFiltro(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="BORRADOR">Borrador</MenuItem>
            <MenuItem value="ENVIADA">Enviada</MenuItem>
            <MenuItem value="APROBADA">Aprobada</MenuItem>
            <MenuItem value="RECHAZADA">Rechazada</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small">
          <InputLabel>Sector</InputLabel>
          <Select
            value={sectorFiltro}
            label="Sector"
            onChange={(e) => setSectorFiltro(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="PRIVADO">Privado</MenuItem>
            <MenuItem value="PUBLICO">Público</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchData()}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => nav("/cotizaciones/nueva")}
        >
          Nueva Cotización
        </Button>
      </Stack>

      {/* Errores */}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
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
              <TableCell width={48}>#</TableCell>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Sector</TableCell>
              <TableCell align="center">Servicios</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Fecha</TableCell>
              <TableCell>Vigencia</TableCell>
              <TableCell align="right" width={220}>
                Acciones
              </TableCell>
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
              filteredRows.map((row, idx) => (
                <TableRow key={row.id} hover>
                  <TableCell>{page * rowsPerPage + idx + 1}</TableCell>

                  <TableCell>
                    <Typography fontWeight={700} sx={{ lineHeight: 1.15 }}>
                      {row.number}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">#{row.clientId}</Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={row.sector === "PRIVADO" ? "Privado" : "Público"}
                      size="small"
                      color={row.sector === "PRIVADO" ? "primary" : "success"}
                      variant="outlined"
                    />
                  </TableCell>

                  {/* Servicios -> botón Ver más */}
                  <TableCell align="center">
                    <Button
                      size="small"
                      startIcon={<ListAltIcon />}
                      variant="outlined"
                      onClick={() => handleOpenServicios(row)}
                    >
                      Ver más
                    </Button>
                  </TableCell>

                  <TableCell align="right">
                    <Typography fontWeight={600}>{PEN(row.total)}</Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={row.status}
                      size="small"
                      color={getEstadoColor(row.status)}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {fmtDate(row.createdAt)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {fmtDate(row.validUntil)}
                    </Typography>
                  </TableCell>

                  {/* Acciones: aprobar/rechazar, editar, vigencia */}
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {/* Solo mostrar aprobar/rechazar si está ENVIADA */}
                      {row.status === "ENVIADA" && (
                        <>
                          <IconButton
                            size="small"
                            color="success"
                            title="Aprobar cotización"
                            onClick={() => handleOpenApprove(row)}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>

                          <IconButton
                            size="small"
                            color="error"
                            title="Rechazar cotización"
                            onClick={() => handleOpenReject(row)}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}

                      <IconButton
                        size="small"
                        color="default"
                        title="Editar"
                        onClick={() => nav(`/cotizaciones/${row.id}/editar`)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>

                      <IconButton
                        size="small"
                        color="secondary"
                        title="Editar vigencia"
                        onClick={() => handleOpenVigencia(row)}
                      >
                        <EventIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

            {!loading && filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={10}>
                  <Box
                    sx={{
                      py: 6,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    No se encontraron cotizaciones
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Paginación */}
        <TablePagination
          component="div"
          rowsPerPageOptions={[5, 10, 20, 50]}
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Estadísticas rápidas (cliente) */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mt: 3,
          borderRadius: 3,
          border: "1px solid #eef2f7",
          background: "#f8fafb",
        }}
      >
        <Stack direction="row" spacing={4} justifyContent="space-around">
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" fontWeight={700} color="primary">
              {totalElements}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total cotizaciones (según filtros)
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" fontWeight={700} color="success.main">
              {filteredRows.filter((r) => r.status === "APROBADA").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Aprobadas (página actual)
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" fontWeight={700} color="info.main">
              {filteredRows.filter((r) => r.status === "ENVIADA").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enviadas (página actual)
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h4" fontWeight={700} color="error.main">
              {filteredRows.filter((r) => r.status === "RECHAZADA").length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rechazadas (página actual)
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* ================= Modal: Servicios ================= */}
      <Dialog
        open={svcOpen}
        onClose={() => setSvcOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <ListAltIcon /> Servicios — {svcQuote?.number ?? ""}
        </DialogTitle>
        <DialogContent dividers>
          {svcLoading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : svcItems.length === 0 ? (
            <Typography color="text.secondary">No hay servicios registrados.</Typography>
          ) : (
            <Table size="small" sx={{ border: "1px solid #eee" }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Servicio</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 160 }}>Costo (S/)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {svcItems.map((it, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{it.name}</TableCell>
                    <TableCell align="right">{PEN(it.cost)}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Subtotal</TableCell>
                  <TableCell align="right">{PEN(svcSubtotal)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>IGV (18%)</TableCell>
                  <TableCell align="right">{PEN(svcIgv)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>Total</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>{PEN(svcTotal)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setSvcOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ================= Modal: Editar Vigencia ================= */}
      <Dialog
        open={vigOpen}
        onClose={() => setVigOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <EventIcon /> Editar vigencia — {vigRow?.number ?? ""}
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Válida hasta"
            type="date"
            value={vigDate}
            onChange={(e) => setVigDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Selecciona la fecha hasta la cual es válida la cotización."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVigOpen(false)} disabled={vigLoading}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={updateVigencia}
            disabled={vigLoading}
          >
            {vigLoading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= Modal: Aprobar Cotización ================= */}
      <Dialog
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <CheckCircleIcon color="success" /> Aprobar cotización — {approveRow?.number ?? ""}
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Estás a punto de aprobar la cotización <strong>{approveRow?.number}</strong> por un total de <strong>{PEN(approveRow?.total || 0)}</strong>.
          </Alert>
          <TextField
            label="Motivo de aprobación (opcional)"
            multiline
            rows={3}
            value={approveReason}
            onChange={(e) => setApproveReason(e.target.value)}
            fullWidth
            placeholder="Ej: Cumple con todos los requisitos solicitados"
            helperText="Este campo es opcional. Si no lo llenas, se registrará como 'Aprobada desde el sistema'."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveOpen(false)} disabled={approveLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApproveQuote}
            disabled={approveLoading}
            startIcon={approveLoading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          >
            {approveLoading ? "Aprobando..." : "Aprobar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ================= Modal: Rechazar Cotización ================= */}
      <Dialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <CancelIcon color="error" /> Rechazar cotización — {rejectRow?.number ?? ""}
        </DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Estás a punto de rechazar la cotización <strong>{rejectRow?.number}</strong>. Esta acción quedará registrada en el historial.
          </Alert>
          <TextField
            label="Motivo de rechazo *"
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
            required
            placeholder="Ej: Precio fuera del presupuesto aprobado"
            helperText="Este campo es obligatorio para rechazar la cotización."
            error={rejectReason.trim() === ""}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)} disabled={rejectLoading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleRejectQuote}
            disabled={rejectLoading || !rejectReason.trim()}
            startIcon={rejectLoading ? <CircularProgress size={16} /> : <CancelIcon />}
          >
            {rejectLoading ? "Rechazando..." : "Rechazar"}
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}