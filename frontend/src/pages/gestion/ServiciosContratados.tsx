// src/pages/ops/ServiciosContratados.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
  IconButton,
  InputAdornment,
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
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CancelIcon from "@mui/icons-material/Cancel";
import ConstructionIcon from "@mui/icons-material/Construction";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";

import AppLayout from "../../layout/AppLayout";
import { useNavigate } from "react-router-dom";

import type {
  ContractedServiceDTO,
  ServiceStatus,
  BillingStatus,
  CollectionStatus,
} from "../../types/contractedServices";
import {
  listContractedServices,
  updateExecutionStatus,
  recomputeStates,
  completeIfPossible,
} from "../../apis/contractedServicesApi";

/* ================= Helpers de presentación ================= */
const VCM_BG_SOFT = "#fff7ed";

const execColor = (
  s: ServiceStatus
): "default" | "info" | "success" | "error" =>
  s === "PENDIENTE"
    ? "default"
    : s === "EN_EJECUCION"
    ? "info"
    : s === "COMPLETADO"
    ? "success"
    : "error";

const billColor = (b: BillingStatus): "default" | "warning" | "success" =>
  b === "NO_FACTURADO"
    ? "default"
    : b === "FACTURADO_PARCIAL"
    ? "warning"
    : "success";

const collColor = (c: CollectionStatus): "default" | "warning" | "success" =>
  c === "PENDIENTE_COBRO"
    ? "default"
    : c === "COBRO_PARCIAL"
    ? "warning"
    : "success";

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString("es-PE") : "—";
const fmtMoney = (v?: number) =>
  v == null
    ? "—"
    : `S/ ${v.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;

// Texto “bonito” para los estados (sin guiones bajos)
const prettyExecStatus = (s: ServiceStatus): string => {
  if (s === "EN_EJECUCION") return "EN EJECUCIÓN";
  return s.replace(/_/g, " ");
};
const prettyBillingStatus = (b: BillingStatus): string =>
  b.replace(/_/g, " ");
const prettyCollectionStatus = (c: CollectionStatus): string =>
  c.replace(/_/g, " ");

/* ================= Página ================= */

export default function ServiciosContratados() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<ContractedServiceDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | ServiceStatus>("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [total, setTotal] = useState(0);

  // TODO: tomar del contexto
  const orgId = 1;

  async function fetchData() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await listContractedServices({
        orgId,
        q,
        status: status === "" ? undefined : status,
        page,
        size,
      });
      setRows(data.content || []);
      setTotal(data.totalElements ?? 0);
    } catch (e: any) {
      const statusCode = e?.response?.status;
      const backendMessage =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        e?.message ||
        "Error inesperado";

      if (statusCode === 401) {
        setErrorMsg(
          "Tu sesión expiró o no es válida. Inicia sesión nuevamente."
        );
      } else if (statusCode === 403) {
        setErrorMsg("No tienes permisos para ver Servicios Contratados.");
      } else if (statusCode === 500) {
        setErrorMsg("Error interno del servidor al cargar los datos.");
      } else {
        setErrorMsg(`Error al cargar: ${backendMessage}`);
      }

      console.error(
        "GET /api/contracted-services ->",
        statusCode,
        e?.response?.data || e
      );
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Servicios Contratados";
  }, []);

  useEffect(() => {
    fetchData();
  }, [q, status, page, size]);

  // ================== MODAL "Iniciar servicio" ==================
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [selectedService, setSelectedService] =
    useState<ContractedServiceDTO | null>(null);
  const [plannedEndDate, setPlannedEndDate] = useState<string>(""); // YYYY-MM-DD
  const [savingStart, setSavingStart] = useState(false);

  const defaultEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  };

  const openStartDialog = (row: ContractedServiceDTO) => {
    setSelectedService(row);
    if (row.endDate) {
      const iso = new Date(row.endDate).toISOString().slice(0, 10);
      setPlannedEndDate(iso);
    } else {
      setPlannedEndDate(defaultEndDate());
    }
    setStartDialogOpen(true);
  };

  const handleConfirmStart = async () => {
    if (!selectedService) return;
    if (!plannedEndDate) {
      setErrorMsg("Debes indicar una fecha de fin planificada.");
      return;
    }
    try {
      setSavingStart(true);
      await updateExecutionStatus(
        selectedService.id,
        "EN_EJECUCION",
        plannedEndDate
      );
      setStartDialogOpen(false);
      setSelectedService(null);
      setPlannedEndDate("");
      await fetchData();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "No se pudo marcar en ejecución.";
      setErrorMsg(msg);
      console.error("updateExecutionStatus(EN_EJECUCION) ->", e);
    } finally {
      setSavingStart(false);
    }
  };

  // ================== MODAL INFO ==================
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoService, setInfoService] =
    useState<ContractedServiceDTO | null>(null);

  const openInfoDialog = (row: ContractedServiceDTO) => {
    setInfoService(row);
    setInfoDialogOpen(true);
  };

  // ================== Acciones sobre fila ==================

  const toCancel = async (id: number) => {
    try {
      await updateExecutionStatus(id, "CANCELADO");
      fetchData();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "No se pudo cancelar.";
      setErrorMsg(msg);
      console.error("updateExecutionStatus(cancel) ->", e);
    }
  };

  const onRecompute = async (id: number) => {
    try {
      await recomputeStates(id);
      fetchData();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "No se pudo recalcular.";
      setErrorMsg(msg);
      console.error("recomputeStates ->", e);
    }
  };

  const onComplete = async (id: number) => {
    try {
      const res = await completeIfPossible(id);
      console.debug("completeIfPossible:", res);
      fetchData();
    } catch (e: any) {
      const msg =
        e?.response?.data?.message || e?.message || "No se pudo completar.";
      setErrorMsg(msg);
      console.error("completeIfPossible ->", e);
    }
  };

  const goCreateOS = (row: ContractedServiceDTO) => {
    navigate(`/ops/os/new?contractedServiceId=${row.id}`);
  };
  const goManageOS = (row: ContractedServiceDTO) => {
    navigate(`/ops/os?contractedServiceId=${row.id}`);
  };

  const filtered = useMemo(() => rows, [rows]);

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
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Servicios Contratados
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Servicios</Typography>
              <Typography color="text.primary">Contratados</Typography>
            </Breadcrumbs>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => fetchData()}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/ops/contracted-services/new")}
            >
              Nuevo Servicio
            </Button>
          </Stack>
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
          placeholder="Buscar por # o cliente..."
          size="small"
          value={q}
          onChange={(e) => {
            setPage(0);
            setErrorMsg(null);
            setQ(e.target.value);
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
          <Select
            displayEmpty
            value={status}
            onChange={(e) => {
              setPage(0);
              setErrorMsg(null);
              setStatus(e.target.value as any);
            }}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">
              <em>Todos los estados</em>
            </MenuItem>
            <MenuItem value="PENDIENTE">Pendiente (ejecución)</MenuItem>
            <MenuItem value="EN_EJECUCION">En ejecución</MenuItem>
            <MenuItem value="COMPLETADO">Completado</MenuItem>
            <MenuItem value="CANCELADO">Cancelado</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />
      </Stack>

      {/* Mensaje de error */}
      {errorMsg && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          {errorMsg}
        </Alert>
      )}

      {/* Tabla */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow
              sx={{
                "& th": {
                  fontWeight: 700,
                  backgroundColor: "#f7f9fc",
                  borderBottom: "1px solid #e5e7eb",
                },
              }}
            >
              <TableCell>#</TableCell>
              <TableCell>Número</TableCell>
              <TableCell align="center">Estados</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            )}

            {!loading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    Sin resultados
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              filtered.map((r, i) => (
                <TableRow key={r.id} hover>
                  <TableCell>{page * size + i + 1}</TableCell>

                  <TableCell>
                    <Typography fontWeight={700}>{r.number}</Typography>
                  </TableCell>

                  {/* Columna unificada de estados */}
                  <TableCell>
                    <Stack spacing={0.6} direction="column">
                      <Chip
                        size="small"
                        variant="outlined"
                        label={prettyExecStatus(r.status)}
                        color={execColor(r.status)}
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={prettyBillingStatus(r.billingStatus)}
                        color={billColor(r.billingStatus)}
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={prettyCollectionStatus(r.collectionStatus)}
                        color={collColor(r.collectionStatus)}
                        sx={{ fontWeight: 600 }}
                      />
                    </Stack>
                  </TableCell>

                  <TableCell align="right">{fmtMoney(r.total)}</TableCell>

                  {/* Acciones */}
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={0.5}
                      justifyContent="flex-end"
                      sx={{ "& .MuiIconButton-root svg": { fontSize: 18 } }}
                    >
                      {/* Ojo -> abre modal de detalle */}
                      <IconButton
                        color="primary"
                        onClick={() => openInfoDialog(r)}
                        title="Ver detalle"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>



                      {/* Pasar a EN_EJECUCION */}
                      {r.status === "PENDIENTE" && (
                        <IconButton
                          color="info"
                          onClick={() => openStartDialog(r)}
                          title="Marcar En ejecución"
                        >
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      )}

                      {/* Cancelar */}
                      {r.status !== "CANCELADO" && r.status !== "COMPLETADO" && (
                        <IconButton
                          color="error"
                          onClick={() => toCancel(r.id)}
                          title="Cancelar"
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          rowsPerPageOptions={[10, 20, 50]}
          count={total}
          rowsPerPage={size}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setSize(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Filas:"
        />
      </TableContainer>

      {/* Dialog: iniciar servicio */}
      <Dialog
        open={startDialogOpen}
        onClose={() => !savingStart && setStartDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Iniciar servicio contratado
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Typography>
              Estás por marcar el servicio{" "}
              <strong>{selectedService?.number}</strong> como{" "}
              <strong>EN EJECUCIÓN</strong>.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Indica hasta qué fecha se brindará el servicio (fecha de fin
              planificada). Podrás ajustarla luego si es necesario.
            </Typography>

            <TextField
              label="Fecha fin del servicio"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={plannedEndDate}
              onChange={(e) => setPlannedEndDate(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStartDialogOpen(false)} disabled={savingStart}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmStart}
            disabled={savingStart || !plannedEndDate}
          >
            {savingStart ? <CircularProgress size={18} /> : "Iniciar servicio"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: info compacta */}
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Detalle del servicio contratado
        </DialogTitle>
        <DialogContent dividers>
          {infoService && (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" color="text.secondary">
                Número de servicio
              </Typography>
              <Typography fontWeight={700}>{infoService.number}</Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Cliente
              </Typography>
              <Typography>
                {infoService.clientId
                  ? `Cliente #${infoService.clientId}`
                  : "—"}
              </Typography>

              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Fechas
              </Typography>
              <Typography variant="body2">
                Contrato: {fmtDate(infoService.contractDate)}
              </Typography>
              <Typography variant="body2">
                Inicio: {fmtDate(infoService.startDate)} · Fin:{" "}
                {fmtDate(infoService.endDate)}
              </Typography>

              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Estados
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  size="small"
                  label={prettyExecStatus(infoService.status)}
                  color={execColor(infoService.status)}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={prettyBillingStatus(infoService.billingStatus)}
                  color={billColor(infoService.billingStatus)}
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={prettyCollectionStatus(infoService.collectionStatus)}
                  color={collColor(infoService.collectionStatus)}
                  variant="outlined"
                />
              </Stack>

              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                Total
              </Typography>
              <Typography>{fmtMoney(infoService.total)}</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
