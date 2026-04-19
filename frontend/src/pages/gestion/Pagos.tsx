// src/pages/gestion/Pagos.tsx
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
  IconButton,
  Divider,
  LinearProgress,
} from "@mui/material";

import SearchIcon        from "@mui/icons-material/Search";
import RefreshIcon       from "@mui/icons-material/Refresh";
import AddIcon           from "@mui/icons-material/Add";
import VisibilityIcon    from "@mui/icons-material/Visibility";
import UploadFileIcon    from "@mui/icons-material/UploadFile";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ZoomInIcon        from "@mui/icons-material/ZoomIn";
import ZoomOutIcon       from "@mui/icons-material/ZoomOut";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import WarningAmberIcon  from "@mui/icons-material/WarningAmber";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CreditScoreIcon   from "@mui/icons-material/CreditScore";
import EditNoteIcon      from "@mui/icons-material/EditNote";
import HistoryIcon       from "@mui/icons-material/History";

import AppLayout from "../../layout/AppLayout";

// =====================================================================
// API helpers
// =====================================================================

const getToken = () =>
  localStorage.getItem("accessToken") || localStorage.getItem("token");

async function listPayments(page = 0, size = 20) {
  const res = await fetch(`/api/billing/payments?page=${page}&size=${size}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function ensureOpenInvoice(contractedServiceId: number) {
  const res = await fetch(`/api/billing/invoices/ensure-open`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ contractedServiceId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    id: number; number: string; total: number; paid: number; balance: number; status: string;
  }>;
}

async function getInvoiceSummary(invoiceId: number) {
  const res = await fetch(`/api/billing/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    id: number; number: string; total: number; paid: number; balance: number; status: string;
  }>;
}

async function getPaymentsByInvoice(invoiceId: number) {
  const res = await fetch(`/api/billing/payments/by-invoice/${invoiceId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    invoiceId: number; invoiceNumber: string;
    total: number; paid: number; balance: number; status: string;
    payments: Payment[];
  }>;
}

async function createPaymentMultipart(payload: {
  invoiceId: number; amount: number; method?: string; refCode?: string; notes?: string; file?: File | null;
}) {
  const fd = new FormData();
  fd.append("data", new Blob([JSON.stringify({
    invoiceId: payload.invoiceId,
    amount: payload.amount,
    method: payload.method || "TRANSFERENCIA",
    refCode: payload.refCode || "",
    notes: payload.notes || "",
  })], { type: "application/json" }));
  if (payload.file) fd.append("file", payload.file);
  const res = await fetch(`/api/billing/payments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function correctPaymentMultipart(paymentId: number, payload: {
  amount: number; method?: string; refCode?: string; notes?: string;
  correctionReason: string; file?: File | null;
}) {
  const fd = new FormData();
  fd.append("data", new Blob([JSON.stringify({
    amount: payload.amount,
    method: payload.method || "TRANSFERENCIA",
    refCode: payload.refCode || "",
    notes: payload.notes || "",
    correctionReason: payload.correctionReason,
  })], { type: "application/json" }));
  if (payload.file) fd.append("file", payload.file);
  const res = await fetch(`/api/billing/payments/${paymentId}/correct`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function getPaymentFile(id: number): Promise<Blob> {
  const res = await fetch(`/api/billing/payments/${id}/file`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

// =====================================================================
// Tipos
// =====================================================================

type Payment = {
  id: number;
  number: string;
  invoiceId: number;
  amount: number;
  method: string;
  refCode?: string | null;
  notes?: string | null;
  paidAt: string;
  fileName?: string | null;
  filePath?: string | null;
  fileSize?: number | null;
  contentType?: string | null;
  createdBy?: number | null;
  createdAt?: string | null;
  status?: string;           // VALIDO | CORREGIDO | ANULADO
  correctionOf?: number | null;
  correctionReason?: string | null;
};

type InvoiceSummary = {
  id: number; number: string;
  total: number; paid: number; balance: number; status: string;
};

type PageResp<T> = { content: T[]; totalElements: number; number: number; size: number };

// =====================================================================
// Helpers visuales
// =====================================================================

const PEN = (v: number) =>
  `S/ ${Number(v || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDateTime = (d?: string | null) => {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-PE", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
};

const METHODS = ["EFECTIVO", "TRANSFERENCIA", "TARJETA", "YAPE", "PLIN"];

const paymentStatusChip = (status?: string) => {
  if (!status || status === "VALIDO") return null;
  if (status === "CORREGIDO")
    return <Chip size="small" label="Corregido" color="warning" variant="outlined" sx={{ ml: 1 }} />;
  if (status === "ANULADO")
    return <Chip size="small" label="Anulado"   color="error"   variant="outlined" sx={{ ml: 1 }} />;
  return null;
};

const invStatusColor = (s?: string) => {
  if (s === "PAGADA_TOTAL")   return "success";
  if (s === "PAGADA_PARCIAL") return "warning";
  return "default";
};

// =====================================================================
// Componente principal
// =====================================================================

export default function Pagos() {

  // ── Lista principal ──
  const [rows, setRows]               = useState<Payment[]>([]);
  const [loading, setLoading]         = useState(false);
  const [errorMsg, setErrorMsg]       = useState("");
  const [q, setQ]                     = useState("");
  const [debouncedQ, setDebouncedQ]   = useState(q);
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const fetchData = async () => {
    try {
      setLoading(true); setErrorMsg("");
      const data: PageResp<Payment> = await listPayments(page, rowsPerPage);
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo cargar pagos");
      setRows([]); setTotalElements(0);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    document.title = "Pagos";
    const token = getToken();
    if (!token) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const filteredRows = useMemo(() => {
    if (!debouncedQ.trim()) return rows;
    const ql = debouncedQ.toLowerCase();
    return rows.filter((r) =>
      (r.number || "").toLowerCase().includes(ql) ||
      (r.method || "").toLowerCase().includes(ql) ||
      (r.refCode || "").toLowerCase().includes(ql) ||
      String(r.invoiceId).includes(ql)
    );
  }, [rows, debouncedQ]);

  // ── Crear pago ──
  const [openCreate, setOpenCreate]   = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState({
    invoiceId: "", amount: "", method: "TRANSFERENCIA",
    refCode: "", notes: "", file: null as File | null,
  });

  // resumen de factura al registrar pago
  const [invSummary, setInvSummary]         = useState<InvoiceSummary | null>(null);
  const [invPayments, setInvPayments]       = useState<Payment[]>([]);
  const [loadingInvInfo, setLoadingInvInfo] = useState(false);

  // Carga info de factura cuando hay invoiceId
  useEffect(() => {
    const id = Number(form.invoiceId);
    if (!id || !openCreate) { setInvSummary(null); setInvPayments([]); return; }
    let cancelled = false;
    setLoadingInvInfo(true);
    getPaymentsByInvoice(id)
      .then((d) => {
        if (cancelled) return;
        setInvSummary({ id: d.invoiceId, number: d.invoiceNumber, total: d.total, paid: d.paid, balance: d.balance, status: d.status });
        setInvPayments(d.payments || []);
      })
      .catch(() => { if (!cancelled) { setInvSummary(null); setInvPayments([]); } })
      .finally(() => { if (!cancelled) setLoadingInvInfo(false); });
    return () => { cancelled = true; };
  }, [form.invoiceId, openCreate]);

  const canSubmit = Number(form.invoiceId) > 0 && Number(form.amount) > 0 && !submitting;

  async function handleCreate() {
    try {
      if (!canSubmit) return;
      setSubmitting(true); setCreateError("");
      await createPaymentMultipart({
        invoiceId: Number(form.invoiceId), amount: Number(form.amount),
        method: form.method, refCode: form.refCode, notes: form.notes, file: form.file,
      });
      setOpenCreate(false);
      setForm({ invoiceId: "", amount: "", method: "TRANSFERENCIA", refCode: "", notes: "", file: null });
      setPage(0); fetchData(); loadPending();
    } catch (e: any) {
      setCreateError(e?.message || "No se pudo registrar el pago");
    } finally { setSubmitting(false); }
  }

  function openCreateDialog() {
    setCreateError("");
    setForm({ invoiceId: "", amount: "", method: "TRANSFERENCIA", refCode: "", notes: "", file: null });
    setOpenCreate(true);
  }

  // ── Visor de archivo ──
  const [viewerOpen, setViewerOpen]       = useState(false);
  const [viewerPayment, setViewerPayment] = useState<Payment | null>(null);
  const [viewerUrl, setViewerUrl]         = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError]     = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let objectUrl: string | null = null;
    const load = async () => {
      if (!viewerOpen || !viewerPayment) return;
      setViewerLoading(true); setViewerError(null); setViewerUrl(null);
      try {
        const blob = await getPaymentFile(viewerPayment.id);
        objectUrl = URL.createObjectURL(blob);
        setViewerUrl(objectUrl);
      } catch (e: any) {
        setViewerError("No se pudo cargar el comprobante.");
      } finally { setViewerLoading(false); }
    };
    load();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [viewerOpen, viewerPayment]);

  const isImageViewer = !!viewerPayment?.contentType?.toLowerCase().startsWith("image/");

  // ── Historial de factura (diálogo independiente) ──
  const [histOpen, setHistOpen]           = useState(false);
  const [histData, setHistData]           = useState<{ summary: InvoiceSummary; payments: Payment[] } | null>(null);
  const [histLoading, setHistLoading]     = useState(false);

  async function openHistory(invoiceId: number) {
    setHistOpen(true); setHistData(null); setHistLoading(true);
    try {
      const d = await getPaymentsByInvoice(invoiceId);
      setHistData({
        summary: { id: d.invoiceId, number: d.invoiceNumber, total: d.total, paid: d.paid, balance: d.balance, status: d.status },
        payments: d.payments || [],
      });
    } catch { /* noop */ }
    finally { setHistLoading(false); }
  }

  // ── Corrección de pago ──
  const [corrTarget, setCorrTarget]         = useState<Payment | null>(null);
  const [corrSubmitting, setCorrSubmitting] = useState(false);
  const [corrError, setCorrError]           = useState("");
  const [corrForm, setCorrForm] = useState({
    amount: "", method: "TRANSFERENCIA", refCode: "", notes: "",
    correctionReason: "", file: null as File | null,
  });

  function openCorrection(p: Payment) {
    setCorrTarget(p);
    setCorrError("");
    setCorrForm({
      amount: String(p.amount), method: p.method || "TRANSFERENCIA",
      refCode: p.refCode || "", notes: p.notes || "",
      correctionReason: "", file: null,
    });
  }

  async function handleCorrect() {
    if (!corrTarget) return;
    if (!corrForm.correctionReason.trim()) {
      setCorrError("El motivo de corrección es obligatorio.");
      return;
    }
    if (Number(corrForm.amount) <= 0) {
      setCorrError("El importe corregido debe ser mayor a 0.");
      return;
    }
    try {
      setCorrSubmitting(true); setCorrError("");
      await correctPaymentMultipart(corrTarget.id, {
        amount: Number(corrForm.amount), method: corrForm.method,
        refCode: corrForm.refCode, notes: corrForm.notes,
        correctionReason: corrForm.correctionReason, file: corrForm.file,
      });
      setCorrTarget(null);
      setPage(0); fetchData(); loadPending();
    } catch (e: any) {
      setCorrError(e?.message || "No se pudo corregir el pago");
    } finally { setCorrSubmitting(false); }
  }

  // ── Pendientes de cobro ──
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingItems, setPendingItems] = useState<
    { id: number; number: string; clientId: number; total: number }[]
  >([]);

  async function loadPending() {
    try {
      const r = await fetch(`/api/notifications/pending-collection?orgId=1`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!r.ok) return;
      const j = await r.json();
      setPendingCount(j.count || 0);
      setPendingItems(j.items || []);
    } catch { /* noop */ }
  }

  useEffect(() => { loadPending(); }, []);

  async function handleOpenForService(contractedServiceId: number) {
    try {
      const inv = await ensureOpenInvoice(contractedServiceId);
      setCreateError("");
      setForm((f) => ({
        ...f,
        invoiceId: String(inv.id),
        // Pre-rellenar con el saldo pendiente (no el total)
        amount: String(inv.balance > 0 ? inv.balance : inv.total || ""),
      }));
      setOpenCreate(true);
    } catch (e: any) {
      alert(e?.message || "No se pudo asegurar la factura");
    }
  }

  // ======================================================================
  // RENDER
  // ======================================================================
  return (
    <AppLayout title="">
      {/* ── Header ── */}
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #fed7aa", background: "#fff7ed" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>Pagos</Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Gestión</Typography>
              <Typography color="text.primary">Pagos</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* ── Panel: Pendientes de cobro ── */}
      <Paper elevation={0} sx={{
        p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #eef2f7",
        background: "linear-gradient(90deg, rgba(255,247,230,0.9), rgba(255,255,255,0.95))",
      }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box sx={{ width: 44, height: 44, borderRadius: "999px", display: "flex", alignItems: "center",
              justifyContent: "center", bgcolor: "#fff3cd", color: "#f59e0b", flexShrink: 0 }}>
              <PendingActionsIcon />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>Pendientes de cobro</Typography>
                <Chip size="small" color={pendingCount > 0 ? "warning" : "default"}
                  icon={<WarningAmberIcon sx={{ fontSize: 18 }} />}
                  label={pendingCount > 0 ? `${pendingCount} servicio${pendingCount > 1 ? "s" : ""}` : "Sin pendientes"}
                  sx={{ fontWeight: 600 }} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Servicios contratados con cobro pendiente. Haz clic en uno para registrar un pago o adelanto.
              </Typography>
            </Box>
          </Stack>
          <Button variant="outlined" size="small" onClick={loadPending} startIcon={<RefreshIcon />}>
            Refrescar
          </Button>
        </Stack>

        {pendingItems.length === 0 ? (
          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, border: "1px dashed #e5e7eb", bgcolor: "rgba(255,255,255,0.8)" }}>
            <Typography variant="body2" color="text.secondary">No tienes servicios con cobro pendiente.</Typography>
          </Box>
        ) : (
          <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {pendingItems.map((it) => (
              <Paper key={it.id} variant="outlined" onClick={() => handleOpenForService(it.id)}
                sx={{ px: 1.75, py: 1.25, borderRadius: 2.5, cursor: "pointer", minWidth: 260,
                  borderColor: "rgba(249,115,22,0.35)", bgcolor: "rgba(255,255,255,0.95)",
                  transition: "all 0.15s ease-in-out",
                  "&:hover": { boxShadow: 3, borderColor: "warning.main", transform: "translateY(-1px)" },
                }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 32, height: 32, borderRadius: "999px", bgcolor: "warning.light",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "warning.dark", flexShrink: 0 }}>
                    <CreditScoreIcon fontSize="small" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{it.number}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      Cliente {it.clientId} • Total {PEN(it.total || 0)}
                    </Typography>
                  </Box>
                  <ArrowForwardIosIcon sx={{ fontSize: 14, color: "text.disabled" }} />
                </Stack>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* ── Barra de acciones ── */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <TextField size="small" placeholder="Buscar por pago, factura, método, referencia"
          value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} sx={{ width: 380 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Registrar Pago
        </Button>
      </Stack>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

      {/* ── Tabla principal ── */}
      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}>
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700 } }}>
              <TableCell width={56}>#</TableCell>
              <TableCell>Pago</TableCell>
              <TableCell>Factura</TableCell>
              <TableCell align="right">Importe</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Ref. Operación</TableCell>
              <TableCell>Fecha/Hora</TableCell>
              <TableCell align="center">Comprobante</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress size={28} /></Box>
                </TableCell>
              </TableRow>
            )}

            {!loading && filteredRows.map((r, idx) => {
              const isCorregido = r.status === "CORREGIDO";
              return (
                <TableRow key={r.id} hover sx={isCorregido ? { opacity: 0.55 } : {}}>
                  <TableCell>{page * rowsPerPage + idx + 1}</TableCell>

                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ReceiptLongOutlinedIcon fontSize="small" color={isCorregido ? "disabled" : "inherit"} />
                      <Box>
                        <Typography fontWeight={700} sx={isCorregido ? { textDecoration: "line-through" } : {}}>
                          {r.number}
                        </Typography>
                        {paymentStatusChip(r.status)}
                        {r.correctionOf && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Corrección del pago #{r.correctionOf}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </TableCell>

                  <TableCell>INV #{r.invoiceId}</TableCell>

                  <TableCell align="right">
                    <Typography fontWeight={700} color={isCorregido ? "text.disabled" : "inherit"}>
                      {PEN(r.amount)}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip size="small" color={isCorregido ? "default" : "primary"}
                      variant="outlined" label={r.method || "—"} />
                  </TableCell>

                  <TableCell>{r.refCode || "—"}</TableCell>
                  <TableCell>{fmtDateTime(r.paidAt)}</TableCell>

                  <TableCell align="center">
                    {r.filePath ? (
                      <IconButton color="primary" size="small" title="Ver comprobante"
                        onClick={() => { setZoom(1); setViewerPayment(r); setViewerOpen(true); }}>
                        <VisibilityIcon />
                      </IconButton>
                    ) : (
                      <Chip size="small" icon={<UploadFileIcon />} label="Sin archivo" variant="outlined" />
                    )}
                  </TableCell>

                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Ver historial de pagos de esta factura">
                        <IconButton size="small" onClick={() => openHistory(r.invoiceId)}>
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {(!r.status || r.status === "VALIDO") && (
                        <Tooltip title="Corregir pago incorrecto">
                          <IconButton size="small" color="warning" onClick={() => openCorrection(r)}>
                            <EditNoteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}

            {!loading && filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9}>
                  <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
                    No hay pagos para mostrar
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination component="div" rowsPerPageOptions={[10, 20, 50]}
          count={totalElements} rowsPerPage={rowsPerPage} page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage="Filas:" />
      </TableContainer>

      {/* ====================================================
           Dialog: REGISTRAR PAGO (parciales incluidos)
         ==================================================== */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: "flex", gap: 1, alignItems: "center" }}>
          <AddIcon /> Registrar pago / adelanto
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>

            {/* ── Info de factura ── */}
            {form.invoiceId && (
              <>
                {loadingInvInfo ? (
                  <LinearProgress />
                ) : invSummary ? (
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f8fafc" }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Factura {invSummary.number}
                      </Typography>
                      <Chip size="small" label={invSummary.status} color={invStatusColor(invSummary.status) as any} />
                    </Stack>
                    <Stack direction="row" spacing={3}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Total</Typography>
                        <Typography variant="body2" fontWeight={700}>{PEN(invSummary.total)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Ya pagado</Typography>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          {PEN(invSummary.paid)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Saldo pendiente</Typography>
                        <Typography variant="body2" fontWeight={700}
                          color={invSummary.balance > 0 ? "warning.main" : "success.main"}>
                          {PEN(invSummary.balance)}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Barra de progreso de cobro */}
                    {invSummary.total > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress variant="determinate"
                          value={Math.min(100, (invSummary.paid / invSummary.total) * 100)}
                          color={invSummary.balance <= 0 ? "success" : "warning"}
                          sx={{ height: 6, borderRadius: 3 }} />
                        <Typography variant="caption" color="text.secondary">
                          {((invSummary.paid / invSummary.total) * 100).toFixed(1)}% cobrado
                        </Typography>
                      </Box>
                    )}

                    {/* Historial de abonos */}
                    {invPayments.length > 0 && (
                      <>
                        <Divider sx={{ my: 1.5 }} />
                        <Typography variant="caption" fontWeight={700} color="text.secondary">
                          ABONOS REGISTRADOS ({invPayments.length})
                        </Typography>
                        <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                          {invPayments.map((ip) => (
                            <Stack key={ip.id} direction="row" justifyContent="space-between" alignItems="center"
                              sx={{ opacity: ip.status === "CORREGIDO" ? 0.5 : 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                {fmtDateTime(ip.paidAt)} — {ip.method}
                                {ip.status === "CORREGIDO" && " (corregido)"}
                              </Typography>
                              <Typography variant="caption" fontWeight={700}
                                sx={{ textDecoration: ip.status === "CORREGIDO" ? "line-through" : "none" }}>
                                {PEN(ip.amount)}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </>
                    )}
                  </Paper>
                ) : null}
              </>
            )}

            <TextField label="ID de Factura" type="number" value={form.invoiceId}
              onChange={(e) => setForm((f) => ({ ...f, invoiceId: e.target.value }))}
              fullWidth required disabled={!!form.invoiceId} />

            <TextField label="Importe del abono (S/)" type="number" value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              fullWidth required inputProps={{ step: "0.01", min: "0.01" }}
              helperText={
                invSummary && invSummary.balance > 0
                  ? `Saldo pendiente: ${PEN(invSummary.balance)}. Puedes pagar un adelanto menor.`
                  : "Ingresa el importe que se paga ahora."
              } />

            <FormControl fullWidth>
              <InputLabel>Método</InputLabel>
              <Select label="Método" value={form.method}
                onChange={(e) => setForm((f) => ({ ...f, method: String(e.target.value) }))}>
                {METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField label="Referencia de operación" value={form.refCode}
              onChange={(e) => setForm((f) => ({ ...f, refCode: e.target.value }))}
              fullWidth placeholder="Ej: Nro de operación o voucher" />

            <TextField label="Notas" value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              fullWidth multiline rows={2} />

            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
              {form.file ? form.file.name : "Adjuntar comprobante (PDF/JPG/PNG)"}
              <input hidden type="file" accept="application/pdf,image/*"
                onChange={(e) => setForm((f) => ({ ...f, file: e.target.files?.[0] || null }))} />
            </Button>

            {createError && <Alert severity="error">{createError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)} disabled={submitting}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!canSubmit}>
            {submitting ? <CircularProgress size={18} /> : "Registrar pago"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====================================================
           Dialog: HISTORIAL DE FACTURA
         ==================================================== */}
      <Dialog open={histOpen} onClose={() => setHistOpen(false)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: "flex", gap: 1, alignItems: "center" }}>
          <HistoryIcon /> Historial de pagos
        </DialogTitle>
        <DialogContent dividers>
          {histLoading && <LinearProgress />}
          {!histLoading && !histData && (
            <Alert severity="info">No se pudo cargar el historial.</Alert>
          )}
          {!histLoading && histData && (
            <Stack spacing={2}>
              {/* Resumen */}
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f8fafc" }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Factura {histData.summary.number}
                  </Typography>
                  <Chip size="small" label={histData.summary.status}
                    color={invStatusColor(histData.summary.status) as any} />
                </Stack>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total</Typography>
                    <Typography variant="body2" fontWeight={700}>{PEN(histData.summary.total)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Cobrado</Typography>
                    <Typography variant="body2" fontWeight={700} color="success.main">
                      {PEN(histData.summary.paid)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Saldo</Typography>
                    <Typography variant="body2" fontWeight={700}
                      color={histData.summary.balance > 0 ? "warning.main" : "success.main"}>
                      {PEN(histData.summary.balance)}
                    </Typography>
                  </Box>
                </Stack>
                {histData.summary.total > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress variant="determinate"
                      value={Math.min(100, (histData.summary.paid / histData.summary.total) * 100)}
                      color={histData.summary.balance <= 0 ? "success" : "warning"}
                      sx={{ height: 6, borderRadius: 3 }} />
                  </Box>
                )}
              </Paper>

              {/* Lista de pagos */}
              {histData.payments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Sin pagos registrados aún.</Typography>
              ) : (
                <Stack spacing={1}>
                  {histData.payments.map((p, i) => {
                    const isCorr = p.status === "CORREGIDO";
                    return (
                      <Paper key={p.id} variant="outlined"
                        sx={{ p: 1.5, borderRadius: 2, opacity: isCorr ? 0.55 : 1,
                          borderColor: isCorr ? "#e5e7eb" : "divider" }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography variant="body2" fontWeight={700}
                                sx={{ textDecoration: isCorr ? "line-through" : "none" }}>
                                {p.number}
                              </Typography>
                              {paymentStatusChip(p.status)}
                              {p.correctionOf && (
                                <Chip size="small" variant="outlined" color="info"
                                  label={`Corrige #${p.correctionOf}`} />
                              )}
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {fmtDateTime(p.paidAt)} · {p.method}
                              {p.refCode ? ` · Ref: ${p.refCode}` : ""}
                            </Typography>
                            {isCorr && p.correctionReason && (
                              <Typography variant="caption" color="warning.main" sx={{ display: "block" }}>
                                Motivo: {p.correctionReason}
                              </Typography>
                            )}
                          </Box>
                          <Typography fontWeight={700} variant="body2"
                            color={isCorr ? "text.disabled" : "text.primary"}
                            sx={{ textDecoration: isCorr ? "line-through" : "none", whiteSpace: "nowrap" }}>
                            {PEN(p.amount)}
                          </Typography>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* ====================================================
           Dialog: CORRECCIÓN DE PAGO
         ==================================================== */}
      <Dialog open={!!corrTarget} onClose={() => setCorrTarget(null)} fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: "flex", gap: 1, alignItems: "center" }}>
          <EditNoteIcon color="warning" /> Corregir pago {corrTarget?.number}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Alert severity="warning">
              El pago original quedará marcado como <strong>Corregido</strong> y se creará un nuevo
              registro con el importe correcto. El historial se conserva completo.
            </Alert>

            {corrTarget && (
              <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#fffbf0" }}>
                <Typography variant="caption" color="text.secondary">REGISTRO ORIGINAL</Typography>
                <Stack direction="row" spacing={3} sx={{ mt: 0.5 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Importe</Typography>
                    <Typography variant="body2" fontWeight={700}
                      sx={{ textDecoration: "line-through", color: "text.disabled" }}>
                      {PEN(corrTarget.amount)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Método</Typography>
                    <Typography variant="body2">{corrTarget.method}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Fecha</Typography>
                    <Typography variant="body2">{fmtDateTime(corrTarget.paidAt)}</Typography>
                  </Box>
                </Stack>
              </Paper>
            )}

            <TextField label="Motivo de la corrección *" value={corrForm.correctionReason}
              onChange={(e) => setCorrForm((f) => ({ ...f, correctionReason: e.target.value }))}
              fullWidth multiline rows={2}
              placeholder="Ej: El monto fue ingresado incorrectamente. El pago real fue S/ 500." />

            <TextField label="Importe correcto (S/) *" type="number" value={corrForm.amount}
              onChange={(e) => setCorrForm((f) => ({ ...f, amount: e.target.value }))}
              fullWidth required inputProps={{ step: "0.01", min: "0.01" }} />

            <FormControl fullWidth>
              <InputLabel>Método</InputLabel>
              <Select label="Método" value={corrForm.method}
                onChange={(e) => setCorrForm((f) => ({ ...f, method: String(e.target.value) }))}>
                {METHODS.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField label="Referencia de operación" value={corrForm.refCode}
              onChange={(e) => setCorrForm((f) => ({ ...f, refCode: e.target.value }))} fullWidth />

            <TextField label="Notas" value={corrForm.notes}
              onChange={(e) => setCorrForm((f) => ({ ...f, notes: e.target.value }))}
              fullWidth multiline rows={2} />

            <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
              {corrForm.file ? corrForm.file.name : "Adjuntar nuevo comprobante (opcional)"}
              <input hidden type="file" accept="application/pdf,image/*"
                onChange={(e) => setCorrForm((f) => ({ ...f, file: e.target.files?.[0] || null }))} />
            </Button>

            {corrError && <Alert severity="error">{corrError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCorrTarget(null)} disabled={corrSubmitting}>Cancelar</Button>
          <Button variant="contained" color="warning" onClick={handleCorrect} disabled={corrSubmitting}>
            {corrSubmitting ? <CircularProgress size={18} /> : "Aplicar corrección"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====================================================
           Dialog: VISOR DE COMPROBANTE
         ==================================================== */}
      <Dialog open={viewerOpen} onClose={() => setViewerOpen(false)} fullWidth maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Comprobante — {viewerPayment?.number}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, backgroundColor: isImageViewer ? "#000" : "#fff" }}>
          <Box sx={{ height: "80vh", position: "relative" }}>
            {viewerLoading && (
              <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CircularProgress size={28} />
              </Box>
            )}
            {viewerError && !viewerLoading && <Box sx={{ p: 3 }}><Alert severity="error">{viewerError}</Alert></Box>}
            {!viewerLoading && !viewerError && !viewerUrl && (
              <Box sx={{ p: 3 }}><Alert severity="info">Sin archivo para mostrar.</Alert></Box>
            )}
            {viewerUrl && !viewerLoading && !viewerError && (
              isImageViewer ? (
                <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Box sx={{ maxWidth: "100%", maxHeight: "100%", overflow: "auto" }}>
                    <img src={viewerUrl} alt={viewerPayment?.fileName || viewerPayment?.number}
                      style={{ display: "block", margin: "0 auto", width: `${zoom * 50}%`, maxWidth: "none", height: "auto" }} />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ width: "100%", height: "100%", backgroundColor: "#fff" }}>
                  <iframe title="Comprobante" src={viewerUrl} style={{ width: "100%", height: "100%", border: 0 }} />
                </Box>
              )
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {viewerUrl && isImageViewer && !viewerLoading && !viewerError && (
            <>
              <IconButton onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} title="Alejar"><ZoomOutIcon /></IconButton>
              <IconButton onClick={() => setZoom((z) => Math.min(3, z + 0.25))} title="Acercar"><ZoomInIcon /></IconButton>
            </>
          )}
          <Box sx={{ flex: 0.6 }} />
          <Button onClick={() => setViewerOpen(false)}>Cerrar</Button>
          {viewerUrl && (
            <Button variant="outlined" onClick={() => window.open(viewerUrl, "_blank")}>Abrir en pestaña</Button>
          )}
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
