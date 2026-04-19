// src/pages/leads/Leads.tsx
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
  FormControl,
  InputAdornment,
  InputLabel,
  Menu,
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
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import AppLayout from "../../layout/AppLayout";
import { getServices, type ServiceResponse } from "../../apis/service";

// ======================================================
//                 TIPOS (ACTUALIZADOS)
// ======================================================

export type LeadStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "CONTACTED"
  | "CONVERTED"
  | "DISCARDED";

export type LeadInterest = "INFO" | "QUOTE" | "HIRE" | "OTHER";
export type LeadPriority = "HIGH" | "MEDIUM" | "LOW";

export type Lead = {
  id: number;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  formName?: string | null;
  sourceCode?: string | null;
  status: LeadStatus | string;
  createdAt?: string | null;

  // --- campos extra para entender mejor al cliente ---
  company?: string | null; // Empresa / negocio
  serviceId?: number | null;
  serviceName?: string | null; // Nombre del servicio de interés (para mostrar)
  interest?: LeadInterest | string;
  budgetRange?: string | null; // "Hasta S/ 1,000", "1k - 3k", etc.
  timeframe?: string | null; // "Este mes", "Próximos 3 meses"...
  priority?: LeadPriority | string;
  ownerName?: string | null; // Ejecutivo responsable (opcional)
  nextActionDate?: string | null; // Próxima acción
};

export type LeadCreateRequest = {
  fullName: string;
  email?: string;
  phone?: string;
  message?: string;
  serviceId?: number | null;
  serviceName?: string; // <--- se envía al backend
  sourceCode?: string;

  company?: string;
  interest?: LeadInterest;
  budgetRange?: string;
  timeframe?: string;
  priority?: LeadPriority;
};

// todas las opciones de estado (EN INGLÉS)
const ALL_STATUSES: LeadStatus[] = [
  "NEW",
  "IN_PROGRESS",
  "CONTACTED",
  "CONVERTED",
  "DISCARDED",
];

// ======= Constantes de estilo =======
const VCM_BG_SOFT = "#fff7ed";

// ======================================================
//                     API HELPERS
// ======================================================

async function listLeads(params: {
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

  const res = await fetch(`/api/leads?${qs.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function updateLeadStatusApi(id: number, status: LeadStatus) {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/leads/${id}/status`, {
    method: "PUT",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function createLeadApi(body: LeadCreateRequest) {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/leads`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// PUT /api/leads/:id  (para editar)
async function updateLeadApi(id: number, body: LeadCreateRequest): Promise<Lead> {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/leads/${id}`, {
    method: "PUT",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ======================================================
//                     HELPERS
// ======================================================

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);
};

// Mapeo de estados a chip en español
const statusChip = (s: LeadStatus | string) => {
  const status = s as LeadStatus;
  const map: Record<
    LeadStatus,
    {
      color:
        | "default"
        | "primary"
        | "success"
        | "warning"
        | "error"
        | "info";
      label: string;
    }
  > = {
    NEW: { color: "warning", label: "Nuevo" },
    IN_PROGRESS: { color: "info", label: "En proceso" },
    CONTACTED: { color: "primary", label: "Contactado" },
    CONVERTED: { color: "success", label: "Convertido" },
    DISCARDED: { color: "error", label: "Descartado" },
  };
  const cfg = map[status] || { color: "default", label: String(status) };
  return (
    <Chip size="small" color={cfg.color} variant="outlined" label={cfg.label} />
  );
};

// label bonito para el interés
const interestLabel = (i?: LeadInterest | string | null) => {
  if (!i) return "—";
  const map: Record<LeadInterest, string> = {
    INFO: "Solo información",
    QUOTE: "Quiere cotización",
    HIRE: "Quiere contratar",
    OTHER: "Otro",
  };
  return map[i as LeadInterest] || String(i);
};

// chip de prioridad
const priorityChip = (p?: LeadPriority | string | null) => {
  if (!p) return <Chip size="small" label="Normal" />;
  const map: Record<
    LeadPriority,
    { color: "default" | "warning" | "error"; label: string }
  > = {
    HIGH: { color: "error", label: "Alta" },
    MEDIUM: { color: "warning", label: "Media" },
    LOW: { color: "default", label: "Baja" },
  };
  const cfg = map[p as LeadPriority] || { color: "default", label: String(p) };
  return (
    <Chip size="small" color={cfg.color} variant="outlined" label={cfg.label} />
  );
};

// ======================================================
//                  VISTA PRINCIPAL
// ======================================================

export default function Leads() {
  // --- tabla/listado ---
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [status, setStatus] = useState<"TODOS" | LeadStatus>("TODOS");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // --- catálogo de servicios ---
  const [serviceOptions, setServiceOptions] = useState<ServiceResponse[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [servicesError, setServicesError] = useState<string | null>(null);

  // --- cambio de estado ---
  const [statusMenuAnchor, setStatusMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [statusLead, setStatusLead] = useState<Lead | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  // --- modal Nuevo Lead ---
  const [newOpen, setNewOpen] = useState(false);
  const [newSaving, setNewSaving] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);
  const [newForm, setNewForm] = useState<LeadCreateRequest>({
    fullName: "",
    email: "",
    phone: "",
    message: "",
    serviceId: undefined,
    serviceName: "",
    sourceCode: "crm-manual",
    company: "",
    interest: undefined,
    budgetRange: "",
    timeframe: "",
    priority: undefined,
  });

  // --- modal feedback creación lead ---
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalLoading, setCreateModalLoading] = useState(false);
  const [createModalMessage, setCreateModalMessage] = useState<string | null>(
    null
  );
  const [createModalError, setCreateModalError] = useState(false);

  // --- modal Ver detalle ---
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLead, setViewLead] = useState<Lead | null>(null);

  // --- modal Editar lead ---
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<LeadCreateRequest & { id?: number }>(
    {
      id: undefined,
      fullName: "",
      email: "",
      phone: "",
      message: "",
      serviceId: undefined,
      serviceName: "",
      sourceCode: "crm-manual",
      company: "",
      interest: undefined,
      budgetRange: "",
      timeframe: "",
      priority: undefined,
    }
  );

  // --- modal feedback actualización lead ---
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateModalLoading, setUpdateModalLoading] = useState(false);
  const [updateModalMessage, setUpdateModalMessage] =
    useState<string | null>(null);
  const [updateModalError, setUpdateModalError] = useState(false);

  // debounce búsqueda
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  async function fetchData() {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await listLeads({
        page,
        size: rowsPerPage,
        q: debouncedQ.trim() || undefined,
        status: status || undefined,
      });
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudieron cargar los leads");
      setRows([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }

  async function loadServices() {
    try {
      setServicesError(null);
      setServicesLoading(true);
      const data = await getServices({ onlyActive: true });
      setServiceOptions(data);
    } catch (e) {
      setServicesError("No se pudieron cargar los servicios.");
      setServiceOptions([]);
    } finally {
      setServicesLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Leads";
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token");
    if (!token) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, debouncedQ, status]);

  // cargar catálogo de servicios una sola vez
  useEffect(() => {
    const token =
      localStorage.getItem("accessToken") ||
      localStorage.getItem("token");
    if (!token) return;
    loadServices();
  }, []);

  const filtered = useMemo(() => {
    if (!debouncedQ.trim()) return rows;
    const ql = debouncedQ.toLowerCase();
    return rows.filter(
      (r) =>
        (r.fullName || "").toLowerCase().includes(ql) ||
        (r.email || "").toLowerCase().includes(ql) ||
        (r.phone || "").toLowerCase().includes(ql) ||
        (r.formName || "").toLowerCase().includes(ql) ||
        (r.company || "").toLowerCase().includes(ql) ||
        (r.serviceName || "").toLowerCase().includes(ql)
    );
  }, [rows, debouncedQ]);

  // ==== cambio de estado ====
  const openStatusMenu = (e: any, lead: Lead) => {
    setStatusMenuAnchor(e.currentTarget);
    setStatusLead(lead);
  };

  const closeStatusMenu = () => {
    setStatusMenuAnchor(null);
    setStatusLead(null);
  };

  const handleChangeStatus = async (newStatus: LeadStatus) => {
    if (!statusLead) return;
    if (statusLead.status === newStatus) {
      closeStatusMenu();
      return;
    }
    try {
      setErrorMsg("");
      setStatusUpdatingId(statusLead.id);
      await updateLeadStatusApi(statusLead.id, newStatus);
      await fetchData();
    } catch (e: any) {
      setErrorMsg(
        e?.message || "No se pudo actualizar el estado del lead."
      );
    } finally {
      setStatusUpdatingId(null);
      closeStatusMenu();
    }
  };

  // ==== Nuevo Lead ====
  const openNewLead = () => {
    setNewError(null);
    setNewForm({
      fullName: "",
      email: "",
      phone: "",
      message: "",
      serviceId: undefined,
      serviceName: "",
      sourceCode: "crm-manual",
      company: "",
      interest: undefined,
      budgetRange: "",
      timeframe: "",
      priority: undefined,
    });
    setNewOpen(true);
  };

  const handleSaveNewLead = async () => {
    if (!newForm.fullName.trim()) {
      setNewError("El nombre completo es obligatorio.");
      return;
    }

    const MIN_LOADING_MS = 4000;
    const start = Date.now();

    try {
      setNewError(null);
      setNewSaving(true);

      // Abrimos modal de proceso
      setCreateModalOpen(true);
      setCreateModalLoading(true);
      setCreateModalMessage(null);
      setCreateModalError(false);

      await createLeadApi({
        ...newForm,
        fullName: newForm.fullName.trim(),
        sourceCode: newForm.sourceCode?.trim() || "crm-manual",
      });

      // asegurar mínimo 4s
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_MS - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      setCreateModalLoading(false);
      setCreateModalError(false);
      setCreateModalMessage("El lead se creó correctamente.");

      setNewOpen(false);
      await fetchData(); // recarga tabla
    } catch (e: any) {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_MS - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      setCreateModalLoading(false);
      setCreateModalError(true);
      setCreateModalMessage(
        e?.message || "No se pudo crear el lead. Inténtalo nuevamente."
      );
    } finally {
      setNewSaving(false);
    }
  };

  // ==== Ver detalle ====
  const openViewLead = (lead: Lead) => {
    setViewLead(lead);
    setViewOpen(true);
  };

  const closeViewLead = () => {
    setViewOpen(false);
    setViewLead(null);
  };

  // ==== Editar lead ====
  const openEditLead = (lead: Lead) => {
    setEditError(null);
    setEditForm({
      id: lead.id,
      fullName: lead.fullName || "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      message: "", // si luego el backend devuelve mensaje, lo pones aquí
      serviceId: lead.serviceId ?? undefined,
      serviceName: lead.serviceName ?? "",
      sourceCode: lead.sourceCode ?? "crm-manual",
      company: lead.company ?? "",
      interest: (lead.interest as LeadInterest) || undefined,
      budgetRange: lead.budgetRange ?? "",
      timeframe: lead.timeframe ?? "",
      priority: (lead.priority as LeadPriority) || undefined,
    });
    setEditOpen(true);
  };

  const closeEditLead = () => {
    if (editSaving) return;
    setEditOpen(false);
  };

  const handleSaveEditLead = async () => {
    if (!editForm.fullName.trim()) {
      setEditError("El nombre completo es obligatorio.");
      return;
    }
    if (!editForm.id) return;

    const MIN_LOADING_MS = 4000;
    const start = Date.now();

    try {
      setEditError(null);
      setEditSaving(true);

      // Abrimos modal de proceso de actualización
      setUpdateModalOpen(true);
      setUpdateModalLoading(true);
      setUpdateModalMessage(null);
      setUpdateModalError(false);

      await updateLeadApi(editForm.id, {
        ...editForm,
        fullName: editForm.fullName.trim(),
        sourceCode: editForm.sourceCode?.trim() || "crm-manual",
      });

      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_MS - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      setUpdateModalLoading(false);
      setUpdateModalError(false);
      setUpdateModalMessage("Los cambios se guardaron correctamente.");

      await fetchData();
      setEditOpen(false);
    } catch (e: any) {
      const elapsed = Date.now() - start;
      const remaining = MIN_LOADING_MS - elapsed;
      if (remaining > 0) {
        await new Promise((resolve) => setTimeout(resolve, remaining));
      }

      setUpdateModalLoading(false);
      setUpdateModalError(true);
      setUpdateModalMessage(
        e?.message || "No se pudieron guardar los cambios del lead."
      );
    } finally {
      setEditSaving(false);
    }
  };

  // ======================================================
  //                      RENDER
  // ======================================================

  return (
    <AppLayout title="">
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 3,
          border: "1px solid #fed7aa",
          background: VCM_BG_SOFT,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Leads
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Gestión</Typography>
              <Typography color="text.primary">Leads</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar
            src="/marca-secundaria.png"
            sx={{ width: 72, height: 72 }}
          />
        </Stack>
      </Paper>

      {/* Filtros */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <TextField
          size="small"
          placeholder="Buscar por nombre, empresa, servicio, correo o teléfono"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          sx={{ width: 480 }}
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
            <MenuItem value="NEW">Nuevo</MenuItem>
            <MenuItem value="IN_PROGRESS">En proceso</MenuItem>
            <MenuItem value="CONTACTED">Contactado</MenuItem>
            <MenuItem value="CONVERTED">Convertido</MenuItem>
            <MenuItem value="DISCARDED">Descartado</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="outlined"
          color="warning"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>

        <Button
          variant="contained"
          color="warning"
          startIcon={<AddIcon />}
          onClick={openNewLead}
        >
          Nuevo Lead
        </Button>
      </Stack>

      {/* Errores globales */}
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
              <TableCell>Lead</TableCell>
              <TableCell>Empresa</TableCell>
              <TableCell>Servicio</TableCell>
              <TableCell>Interés</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={7}>
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

                  {/* Lead + fuente */}
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PersonAddAltOutlinedIcon fontSize="small" />
                      <Box>
                        <Typography fontWeight={700}>
                          {r.fullName}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {r.formName || r.sourceCode || "—"}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  {/* Empresa */}
                  <TableCell>
                    <Typography variant="body2">
                      {r.company || "—"}
                    </Typography>
                  </TableCell>

                  {/* Servicio */}
                  <TableCell>
                    <Typography variant="body2">
                      {r.serviceName || "—"}
                    </Typography>
                  </TableCell>

                  {/* Interés */}
                  <TableCell>
                    <Typography variant="body2">
                      {interestLabel(r.interest as LeadInterest)}
                    </Typography>
                  </TableCell>

                  {/* Estado */}
                  <TableCell>
                    {statusUpdatingId === r.id ? (
                      <CircularProgress size={18} />
                    ) : (
                      <Tooltip title="Cambiar estado">
                        <Box
                          onClick={(e) => openStatusMenu(e, r)}
                          sx={{
                            display: "inline-flex",
                            cursor: "pointer",
                          }}
                        >
                          {statusChip(r.status)}
                        </Box>
                      </Tooltip>
                    )}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell align="center">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="center"
                    >
                      <Tooltip title="Ver detalle">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openViewLead(r)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() => openEditLead(r)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box
                    sx={{
                      py: 6,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    No hay leads para mostrar
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          rowsPerPageOptions={[10, 20, 50]}
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas:"
        />
      </TableContainer>

      {/* Menú para cambiar estado */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={closeStatusMenu}
      >
        {ALL_STATUSES.map((s) => (
          <MenuItem
            key={s}
            selected={s === statusLead?.status}
            onClick={() => handleChangeStatus(s)}
          >
            {statusChip(s)}
          </MenuItem>
        ))}
      </Menu>

      {/* Modal Nuevo Lead */}
      <Dialog
        open={newOpen}
        onClose={() => !newSaving && setNewOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nuevo lead</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* --- Datos del contacto --- */}
            <Typography variant="subtitle2" color="text.secondary">
              Datos del contacto
            </Typography>

            <TextField
              label="Nombre completo"
              value={newForm.fullName}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, fullName: e.target.value }))
              }
              required
              fullWidth
            />

            <TextField
              label="Empresa / Negocio"
              value={newForm.company || ""}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, company: e.target.value }))
              }
              fullWidth
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Correo"
                value={newForm.email}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, email: e.target.value }))
                }
                type="email"
                fullWidth
              />
              <TextField
                label="Teléfono"
                value={newForm.phone}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, phone: e.target.value }))
                }
                fullWidth
              />
            </Stack>

            {/* --- Lo que busca --- */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              Lo que busca el cliente
            </Typography>

            {/* Selector de servicio */}
            <FormControl fullWidth disabled={servicesLoading}>
              <InputLabel>Servicio de interés</InputLabel>
              <Select
                label="Servicio de interés"
                value={newForm.serviceId ?? ""}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : undefined;
                  const found = serviceOptions.find((s) => s.id === id);
                  setNewForm((f) => ({
                    ...f,
                    serviceId: id,
                    serviceName: found?.name || "",
                  }));
                }}
              >
                <MenuItem value="">
                  <em>Sin servicio específico</em>
                </MenuItem>
                {serviceOptions.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {servicesError && (
              <Alert severity="warning">{servicesError}</Alert>
            )}

            <TextField
              label="Mensaje / Comentario"
              value={newForm.message || ""}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, message: e.target.value }))
              }
              helperText="Ej: Contabilidad mensual, Implementación CRM, Asesoría tributaria, etc."
              fullWidth
              multiline
              minRows={2}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Interés</InputLabel>
                <Select
                  label="Interés"
                  value={newForm.interest || ""}
                  onChange={(e) =>
                    setNewForm((f) => ({
                      ...f,
                      interest: e.target.value as LeadInterest,
                    }))
                  }
                >
                  <MenuItem value="">
                    <em>Sin especificar</em>
                  </MenuItem>
                  <MenuItem value="INFO">Solo información</MenuItem>
                  <MenuItem value="QUOTE">Quiere cotización</MenuItem>
                  <MenuItem value="HIRE">Quiere contratar</MenuItem>
                  <MenuItem value="OTHER">Otro</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  label="Prioridad"
                  value={newForm.priority || ""}
                  onChange={(e) =>
                    setNewForm((f) => ({
                      ...f,
                      priority: e.target.value as LeadPriority,
                    }))
                  }
                >
                  <MenuItem value="">
                    <em>Normal</em>
                  </MenuItem>
                  <MenuItem value="HIGH">Alta</MenuItem>
                  <MenuItem value="MEDIUM">Media</MenuItem>
                  <MenuItem value="LOW">Baja</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Rango de presupuesto"
                value={newForm.budgetRange || ""}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, budgetRange: e.target.value }))
                }
                helperText='Ej: "Hasta S/ 1,000", "1k - 3k", etc.'
                fullWidth
              />
              <TextField
                label="Plazo estimado"
                value={newForm.timeframe || ""}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, timeframe: e.target.value }))
                }
                helperText='Ej: "Este mes", "Próximos 3 meses"'
                fullWidth
              />
            </Stack>

            <TextField
              label="Fuente (sourceCode)"
              value={newForm.sourceCode}
              onChange={(e) =>
                setNewForm((f) => ({ ...f, sourceCode: e.target.value }))
              }
              helperText='Ej: "crm-manual", "landing-web", "Facebook Ads", "referido"'
              fullWidth
            />

            {newError && <Alert severity="error">{newError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewOpen(false)} disabled={newSaving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSaveNewLead}
            disabled={newSaving}
          >
            {newSaving ? "Guardando..." : "Guardar lead"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal proceso creación lead */}
      <Dialog
        open={createModalOpen}
        onClose={() => {
          if (!createModalLoading) {
            setCreateModalOpen(false);
            setCreateModalMessage(null);
            setCreateModalError(false);
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: "1px solid #fed7aa",
            backgroundColor: VCM_BG_SOFT,
            textAlign: "center",
            py: 3,
          },
        }}
      >
        <DialogContent>
          <Stack spacing={2} alignItems="center">
            {createModalLoading ? (
              <>
                <CircularProgress color="warning" />
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="warning.main"
                >
                  Creando lead...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Por favor espera unos segundos mientras procesamos la
                  información.
                </Typography>
              </>
            ) : (
              <>
                {createModalError ? (
                  <ErrorOutlineIcon
                    sx={{ fontSize: 48, color: "error.main" }}
                  />
                ) : (
                  <CheckCircleOutlineIcon
                    sx={{ fontSize: 48, color: "warning.main" }}
                  />
                )}

                <Typography
                  variant="h6"
                  fontWeight={700}
                  color={createModalError ? "error.main" : "warning.main"}
                >
                  {createModalError ? "No se pudo crear el lead" : "Lead creado"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {createModalMessage}
                </Typography>

                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => {
                    setCreateModalOpen(false);
                    setCreateModalMessage(null);
                    setCreateModalError(false);
                  }}
                  sx={{ mt: 1 }}
                >
                  Cerrar
                </Button>
              </>
            )}
          </Stack>
        </DialogContent>
      </Dialog>

      {/* Modal Ver detalle */}
      <Dialog open={viewOpen} onClose={closeViewLead} maxWidth="sm" fullWidth>
        <DialogTitle>Detalle del lead</DialogTitle>
        <DialogContent dividers>
          {viewLead && (
            <Stack spacing={1.5}>
              <Typography variant="h6">{viewLead.fullName}</Typography>

              <Stack direction="row" spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Empresa
                  </Typography>
                  <Typography>{viewLead.company || "—"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Servicio
                  </Typography>
                  <Typography>{viewLead.serviceName || "—"}</Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Correo
                  </Typography>
                  <Typography>{viewLead.email || "—"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Teléfono
                  </Typography>
                  <Typography>{viewLead.phone || "—"}</Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Interés
                  </Typography>
                  <Typography>
                    {interestLabel(viewLead.interest as LeadInterest)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Presupuesto
                  </Typography>
                  <Typography>{viewLead.budgetRange || "—"}</Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Plazo estimado
                  </Typography>
                  <Typography>{viewLead.timeframe || "—"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Prioridad
                  </Typography>
                  {priorityChip(viewLead.priority as LeadPriority)}
                </Box>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Estado
                  </Typography>
                  {statusChip(viewLead.status)}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Creado
                  </Typography>
                  <Typography>{fmtDate(viewLead.createdAt)}</Typography>
                </Box>
              </Stack>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Fuente
                </Typography>
                <Typography>
                  {viewLead.formName || viewLead.sourceCode || "—"}
                </Typography>
              </Box>

              {viewLead.ownerName && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Ejecutivo responsable
                  </Typography>
                  <Typography>{viewLead.ownerName}</Typography>
                </Box>
              )}

              {viewLead.nextActionDate && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Próxima acción
                  </Typography>
                  <Typography>{fmtDate(viewLead.nextActionDate)}</Typography>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeViewLead}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal Editar lead */}
      <Dialog
        open={editOpen}
        onClose={closeEditLead}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Editar lead</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {/* --- Datos del contacto --- */}
            <Typography variant="subtitle2" color="text.secondary">
              Datos del contacto
            </Typography>

            <TextField
              label="Nombre completo"
              value={editForm.fullName}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, fullName: e.target.value }))
              }
              required
              fullWidth
            />

            <TextField
              label="Empresa / Negocio"
              value={editForm.company || ""}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, company: e.target.value }))
              }
              fullWidth
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Correo"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
                type="email"
                fullWidth
              />
              <TextField
                label="Teléfono"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                }
                fullWidth
              />
            </Stack>

            {/* --- Lo que busca --- */}
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
              Lo que busca el cliente
            </Typography>

            {/* Selector de servicio */}
            <FormControl fullWidth disabled={servicesLoading}>
              <InputLabel>Servicio de interés</InputLabel>
              <Select
                label="Servicio de interés"
                value={editForm.serviceId ?? ""}
                onChange={(e) => {
                  const id = e.target.value ? Number(e.target.value) : undefined;
                  const found = serviceOptions.find((s) => s.id === id);
                  setEditForm((f) => ({
                    ...f,
                    serviceId: id,
                    serviceName: found?.name || "",
                  }));
                }}
              >
                <MenuItem value="">
                  <em>Sin servicio específico</em>
                </MenuItem>
                {serviceOptions.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {servicesError && (
              <Alert severity="warning">{servicesError}</Alert>
            )}

            <TextField
              label="Mensaje / Comentario"
              value={editForm.message || ""}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, message: e.target.value }))
              }
              helperText="Ej: Contabilidad mensual, Implementación CRM, Asesoría tributaria, etc."
              fullWidth
              multiline
              minRows={2}
            />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Interés</InputLabel>
                <Select
                  label="Interés"
                  value={editForm.interest || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      interest: e.target.value as LeadInterest,
                    }))
                  }
                >
                  <MenuItem value="">
                    <em>Sin especificar</em>
                  </MenuItem>
                  <MenuItem value="INFO">Solo información</MenuItem>
                  <MenuItem value="QUOTE">Quiere cotización</MenuItem>
                  <MenuItem value="HIRE">Quiere contratar</MenuItem>
                  <MenuItem value="OTHER">Otro</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Prioridad</InputLabel>
                <Select
                  label="Prioridad"
                  value={editForm.priority || ""}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      priority: e.target.value as LeadPriority,
                    }))
                  }
                >
                  <MenuItem value="">
                    <em>Normal</em>
                  </MenuItem>
                  <MenuItem value="HIGH">Alta</MenuItem>
                  <MenuItem value="MEDIUM">Media</MenuItem>
                  <MenuItem value="LOW">Baja</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Rango de presupuesto"
                value={editForm.budgetRange || ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, budgetRange: e.target.value }))
                }
                helperText='Ej: "Hasta S/ 1,000", "1k - 3k", etc.'
                fullWidth
              />
              <TextField
                label="Plazo estimado"
                value={editForm.timeframe || ""}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, timeframe: e.target.value }))
                }
                helperText='Ej: "Este mes", "Próximos 3 meses"'
                fullWidth
              />
            </Stack>

            <TextField
              label="Fuente (sourceCode)"
              value={editForm.sourceCode}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, sourceCode: e.target.value }))
              }
              helperText='Ej: "crm-manual", "landing-web", "Facebook Ads", "referido"'
              fullWidth
            />

            {editError && <Alert severity="error">{editError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEditLead} disabled={editSaving}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSaveEditLead}
            disabled={editSaving}
          >
            {editSaving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal proceso actualización lead */}
      <Dialog
        open={updateModalOpen}
        onClose={() => {
          if (!updateModalLoading) {
            setUpdateModalOpen(false);
            setUpdateModalMessage(null);
            setUpdateModalError(false);
          }
        }}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: "1px solid #fed7aa",
            backgroundColor: VCM_BG_SOFT,
            textAlign: "center",
            py: 3,
          },
        }}
      >
        <DialogContent>
          <Stack spacing={2} alignItems="center">
            {updateModalLoading ? (
              <>
                <CircularProgress color="warning" />
                <Typography
                  variant="h6"
                  fontWeight={700}
                  color="warning.main"
                >
                  Actualizando lead...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Por favor espera unos segundos mientras guardamos los cambios.
                </Typography>
              </>
            ) : (
              <>
                {updateModalError ? (
                  <ErrorOutlineIcon
                    sx={{ fontSize: 48, color: "error.main" }}
                  />
                ) : (
                  <CheckCircleOutlineIcon
                    sx={{ fontSize: 48, color: "warning.main" }}
                  />
                )}

                <Typography
                  variant="h6"
                  fontWeight={700}
                  color={updateModalError ? "error.main" : "warning.main"}
                >
                  {updateModalError
                    ? "No se pudo actualizar el lead"
                    : "Lead actualizado"}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  {updateModalMessage}
                </Typography>

                <Button
                  variant="contained"
                  color="warning"
                  onClick={() => {
                    setUpdateModalOpen(false);
                    setUpdateModalMessage(null);
                    setUpdateModalError(false);
                  }}
                  sx={{ mt: 1 }}
                >
                  Cerrar
                </Button>
              </>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
