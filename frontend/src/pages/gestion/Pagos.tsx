// src/pages/servicios/Pagos.tsx
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
  Typography,
  IconButton,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

// 👇 nuevos íconos para el panel de pendientes
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CreditScoreIcon from "@mui/icons-material/CreditScore";

import AppLayout from "../../layout/AppLayout";

// === API helpers ===
async function listPayments(page = 0, size = 20) {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/billing/payments?page=${page}&size=${size}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function ensureOpenInvoice(contractedServiceId: number) {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/billing/invoices/ensure-open`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contractedServiceId }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    id: number;
    number: string;
    total: number;
    status: string;
  }>;
}

async function createPaymentMultipart(payload: {
  invoiceId: number;
  amount: number;
  method?: string;
  refCode?: string;
  notes?: string;
  file?: File | null;
}) {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  const fd = new FormData();
  fd.append(
    "data",
    new Blob(
      [
        JSON.stringify({
          invoiceId: payload.invoiceId,
          amount: payload.amount,
          method: payload.method || "TRANSFERENCIA",
          refCode: payload.refCode || "",
          notes: payload.notes || "",
        }),
      ],
      { type: "application/json" }
    )
  );
  if (payload.file) fd.append("file", payload.file);
  const res = await fetch(`/api/billing/payments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// 🔹 Descargar archivo con token y devolver Blob
async function getPaymentFile(id: number): Promise<Blob> {
  const token =
    localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/billing/payments/${id}/file`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.blob();
}

// === Tipos mínimos ===
type Payment = {
  id: number;
  number: string; // PAY-YYYY-0001
  invoiceId: number;
  amount: number;
  method: string;
  refCode?: string | null;
  notes?: string | null;
  paidAt: string; // ISO
  fileName?: string | null;
  filePath?: string | null;
  fileSize?: number | null;
  contentType?: string | null;
  createdBy?: number | null;
  createdAt?: string | null;
};

type PageResp<T> = {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
};

// === Helpers ===
const PEN = (v: number) =>
  `S/ ${Number(v || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDateTime = (d?: string | null) => {
  if (!d) return "—";
  const dt = new Date(d);
  const f = new Intl.DateTimeFormat("es-PE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  return f.format(dt);
};

export default function Pagos() {
  // ====== Estado lista ======
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ====== Filtros y paginación ======
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  // ====== Carga ======
  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const data: PageResp<Payment> = await listPayments(page, rowsPerPage);
      setRows(data.content || []);
      setTotalElements(data.totalElements || 0);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo cargar pagos");
      setRows([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Pagos";
    const token =
      localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) return;
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  // Filtro rápido (por número de pago, refCode, método)
  const filteredRows = useMemo(() => {
    if (!debouncedQ.trim()) return rows;
    const ql = debouncedQ.toLowerCase();
    return rows.filter((r) => {
      const hay =
        r.number?.toLowerCase().includes(ql) ||
        r.method?.toLowerCase().includes(ql) ||
        (r.refCode || "").toLowerCase().includes(ql) ||
        String(r.invoiceId).includes(ql);
      return !!hay;
    });
  }, [rows, debouncedQ]);

  // ====== Crear pago ======
  const [openCreate, setOpenCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{
    invoiceId: string;
    amount: string;
    method: string;
    refCode: string;
    notes: string;
    file: File | null;
  }>({
    invoiceId: "",
    amount: "",
    method: "TRANSFERENCIA",
    refCode: "",
    notes: "",
    file: null,
  });

  const canSubmit =
    Number(form.invoiceId) > 0 && Number(form.amount) > 0 && !submitting;

  async function handleCreate() {
    try {
      if (!canSubmit) return;
      setSubmitting(true);
      await createPaymentMultipart({
        invoiceId: Number(form.invoiceId),
        amount: Number(form.amount),
        method: form.method,
        refCode: form.refCode,
        notes: form.notes,
        file: form.file,
      });
      setOpenCreate(false);
      // reset
      setForm({
        invoiceId: "",
        amount: "",
        method: "TRANSFERENCIA",
        refCode: "",
        notes: "",
        file: null,
      });
      // refrescar
      setPage(0);
      fetchData();
    } catch (e: any) {
      alert(e?.message || "No se pudo registrar el pago");
    } finally {
      setSubmitting(false);
    }
  }

  // ====== Visor de archivo ======
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerPayment, setViewerPayment] = useState<Payment | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.6);

  const openViewer = (p: Payment) => {
    setViewerPayment(p);
    setZoom(1);
    setViewerOpen(true);
  };

  // cuando se abre el dialogo, bajamos el archivo con token
  useEffect(() => {
    let objectUrl: string | null = null;

    const load = async () => {
      if (!viewerOpen || !viewerPayment) return;
      setViewerLoading(true);
      setViewerError(null);
      setViewerUrl(null);

      try {
        const blob = await getPaymentFile(viewerPayment.id);
        objectUrl = URL.createObjectURL(blob);
        setViewerUrl(objectUrl);
      } catch (e: any) {
        console.error("getPaymentFile error", e);
        setViewerError("No se pudo cargar el comprobante.");
      } finally {
        setViewerLoading(false);
      }
    };

    load();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [viewerOpen, viewerPayment]);

  const isImageViewer =
    !!viewerPayment?.contentType &&
    viewerPayment.contentType.toLowerCase().startsWith("image/");

  // ====== Notificación: pendientes de cobro ======
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingItems, setPendingItems] = useState<
    { id: number; number: string; clientId: number; total: number }[]
  >([]);

  async function loadPending() {
    try {
      const token =
        localStorage.getItem("accessToken") || localStorage.getItem("token");
      const r = await fetch(
        `/api/notifications/pending-collection?orgId=1`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!r.ok) return;
      const j = await r.json();
      setPendingCount(j.count || 0);
      setPendingItems(j.items || []);
    } catch {
      /* noop */
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  // Asegurar factura abierta y abrir modal con invoiceId prellenado (y bloqueado)
  async function handleOpenForService(contractedServiceId: number) {
    try {
      const inv = await ensureOpenInvoice(contractedServiceId);
      setForm((f) => ({
        ...f,
        invoiceId: String(inv.id),
        amount: String(inv.total || ""),
      }));
      setOpenCreate(true);
    } catch (e: any) {
      alert(e?.message || "No se pudo asegurar la factura");
    }
  }

  return (
    <AppLayout title="">
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
              Pagos
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Gestión</Typography>
              <Typography color="text.primary">Pagos</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* Panel: Pendientes de cobro */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          mb: 2,
          borderRadius: 3,
          border: "1px solid #eef2f7",
          background:
            "linear-gradient(90deg, rgba(255,247,230,0.9), rgba(255,255,255,0.95))",
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#fff3cd",
                color: "#f59e0b",
                flexShrink: 0,
              }}
            >
              <PendingActionsIcon />
            </Box>

            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1" fontWeight={700}>
                  Pendientes de cobro
                </Typography>
                <Chip
                  size="small"
                  color={pendingCount > 0 ? "warning" : "default"}
                  icon={<WarningAmberIcon sx={{ fontSize: 18 }} />}
                  label={
                    pendingCount > 0
                      ? `${pendingCount} ${
                          pendingCount === 1 ? "servicio" : "servicios"
                        }`
                      : "Sin pendientes"
                  }
                  sx={{ fontWeight: 600 }}
                />
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Servicios contratados con cobro pendiente. Desde aquí puedes
                asegurar la factura y registrar el pago con un solo clic.
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="outlined"
            size="small"
            onClick={loadPending}
            startIcon={<RefreshIcon />}
          >
            Refrescar
          </Button>
        </Stack>

        {pendingItems.length === 0 ? (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              border: "1px dashed #e5e7eb",
              bgcolor: "rgba(255,255,255,0.8)",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No tienes servicios con cobro pendiente. 🎉
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            {pendingItems.map((it) => (
              <Paper
                key={it.id}
                variant="outlined"
                onClick={() => handleOpenForService(it.id)}
                sx={{
                  px: 1.75,
                  py: 1.25,
                  borderRadius: 2.5,
                  cursor: "pointer",
                  minWidth: 260,
                  borderColor: "rgba(249,115,22,0.35)",
                  bgcolor: "rgba(255,255,255,0.95)",
                  transition: "all 0.15s ease-in-out",
                  "&:hover": {
                    boxShadow: 3,
                    borderColor: "warning.main",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: "999px",
                      bgcolor: "warning.light",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "warning.dark",
                      flexShrink: 0,
                    }}
                  >
                    <CreditScoreIcon fontSize="small" />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>
                      {it.number}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                    >
                      Cliente {it.clientId} • Total {PEN(it.total || 0)}
                    </Typography>
                  </Box>
                  <ArrowForwardIosIcon
                    sx={{ fontSize: 14, color: "text.disabled" }}
                  />
                </Stack>
              </Paper>
            ))}
          </Box>
        )}
      </Paper>

      {/* Actions */}
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ mb: 1.5 }}
      >
        <TextField
          size="small"
          placeholder="Buscar por pago, factura, método, referencia"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          sx={{ width: 380 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ flex: 1 }} />

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
        >
          Registrar Pago
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
              <TableCell>Pago</TableCell>
              <TableCell>Factura</TableCell>
              <TableCell align="right">Importe</TableCell>
              <TableCell>Método</TableCell>
              <TableCell>Ref. Operación</TableCell>
              <TableCell>Fecha/Hora</TableCell>
              <TableCell align="center">Comprobante</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <CircularProgress size={28} />
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              filteredRows.map((r, idx) => (
                <TableRow key={r.id} hover>
                  <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ReceiptLongOutlinedIcon fontSize="small" />
                      <Typography fontWeight={700}>{r.number}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>INV #{r.invoiceId}</TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={700}>{PEN(r.amount)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      label={r.method || "—"}
                    />
                  </TableCell>
                  <TableCell>{r.refCode || "—"}</TableCell>
                  <TableCell>{fmtDateTime(r.paidAt)}</TableCell>
                  <TableCell align="center">
                    {r.filePath ? (
                      <IconButton
                        color="primary"
                        size="small"
                        title="Ver comprobante"
                        onClick={() => openViewer(r)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                    ) : (
                      <Chip
                        size="small"
                        icon={<UploadFileIcon />}
                        label="Sin archivo"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}

            {!loading && filteredRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <Box
                    sx={{
                      py: 6,
                      textAlign: "center",
                      color: "text.secondary",
                    }}
                  >
                    No hay pagos para mostrar
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

      {/* Dialog: Crear pago */}
      <Dialog
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle
          sx={{ fontWeight: 800, display: "flex", gap: 1, alignItems: "center" }}
        >
          <AddIcon /> Registrar pago
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="ID de Factura"
              type="number"
              value={form.invoiceId}
              onChange={(e) =>
                setForm((f) => ({ ...f, invoiceId: e.target.value }))
              }
              fullWidth
              required
              disabled={!!form.invoiceId} // 🔒 si viene de ensure-open, queda bloqueado
            />

            <TextField
              label="Importe pagado (S/)"
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm((f) => ({ ...f, amount: e.target.value }))
              }
              fullWidth
              required
              inputProps={{ step: "0.01" }}
            />

            <FormControl fullWidth>
              <InputLabel>Método</InputLabel>
              <Select
                label="Método"
                value={form.method}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    method: String(e.target.value),
                  }))
                }
              >
                <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                <MenuItem value="TARJETA">Tarjeta</MenuItem>
                <MenuItem value="YAPE">Yape</MenuItem>
                <MenuItem value="PLIN">Plin</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Referencia de operación"
              value={form.refCode}
              onChange={(e) =>
                setForm((f) => ({ ...f, refCode: e.target.value }))
              }
              fullWidth
              placeholder="Ej: Nro de operación o voucher"
            />

            <TextField
              label="Notas"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              fullWidth
              multiline
              rows={3}
            />

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadFileIcon />}
            >
              {form.file ? form.file.name : "Adjuntar comprobante (PDF/JPG/PNG)"}
              <input
                hidden
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    file: e.target.files?.[0] || null,
                  }))
                }
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!canSubmit}
          >
            {submitting ? <CircularProgress size={18} /> : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: Visor de comprobante */}
      <Dialog
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Comprobante — {viewerPayment?.number}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 0,
            backgroundColor: isImageViewer ? "#000" : "#fff",
          }}
        >
          <Box sx={{ height: "80vh", position: "relative" }}>
            {viewerLoading && (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CircularProgress size={28} />
              </Box>
            )}

            {viewerError && !viewerLoading && (
              <Box sx={{ p: 3 }}>
                <Alert severity="error">{viewerError}</Alert>
              </Box>
            )}

            {!viewerLoading && !viewerError && !viewerUrl && (
              <Box sx={{ p: 3 }}>
                <Alert severity="info">Sin archivo para mostrar.</Alert>
              </Box>
            )}

            {viewerUrl && !viewerLoading && !viewerError && (
              <>
                {isImageViewer ? (
                  // 👇 VISOR DE IMAGEN CON ZOOM
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        overflow: "auto",
                      }}
                    >
                      <img
                        src={viewerUrl}
                        alt={viewerPayment?.fileName || viewerPayment?.number}
                        style={{
                          display: "block",
                          margin: "0 auto",
                          width: `${zoom * 50}%`,
                          maxWidth: "none",
                          height: "auto",
                        }}
                      />
                    </Box>
                  </Box>
                ) : (
                  // 👇 PDF u otros tipos
                  <Box
                    sx={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: "#fff",
                    }}
                  >
                    <iframe
                      title="Comprobante"
                      src={viewerUrl}
                      style={{ width: "100%", height: "100%", border: 0 }}
                    />
                  </Box>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {viewerUrl && isImageViewer && !viewerLoading && !viewerError && (
            <>
              <IconButton
                onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))}
                title="Alejar"
              >
                <ZoomOutIcon />
              </IconButton>
              <IconButton
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                title="Acercar"
              >
                <ZoomInIcon />
              </IconButton>
            </>
          )}

          <Box sx={{ flex: 0.6 }} />

          <Button onClick={() => setViewerOpen(false)}>Cerrar</Button>
          {viewerUrl && (
            <Button
              variant="outlined"
              onClick={() => window.open(viewerUrl, "_blank")}
            >
              Abrir en pestaña
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
