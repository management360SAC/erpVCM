// src/pages/alertas/AlertasRecordatoriosPage.tsx
import React, { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import dayjs from "dayjs";

// ⬅️ Layout con menú lateral
import AppLayout from "../../layout/AppLayout";

// 🔥 SOLO USAMOS alertsApi - TODO SE GUARDA EN TABLA alerts
import {
  listAlerts,
  markAlertRead,
  createAlert,
  updateAlert,
  deleteAlert,
  type AlertItem,
} from "../../apis/alertsApi";

import DeleteOutline from "@mui/icons-material/DeleteOutline";
import PlayArrow from "@mui/icons-material/PlayArrow";
import PauseCircle from "@mui/icons-material/PauseCircle";
import Edit from "@mui/icons-material/Edit";
import Add from "@mui/icons-material/Add";
import ArrowBackIosNew from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIos from "@mui/icons-material/ArrowForwardIos";

/* =======================
 *   Helpers de texto
 * ======================= */

function formatRepeticion(value: string | undefined) {
  if (!value) return "No se repite";
  switch (value.toLowerCase()) {
    case "diario":
    case "diariamente":
      return "Diario";
    case "semanal":
    case "semanalmente":
      return "Semanal";
    case "mensual":
    case "mensualmente":
      return "Mensual";
    default:
      return value;
  }
}

function formatCanal(value: string | undefined) {
  if (!value) return "En la app";
  switch (value.toLowerCase()) {
    case "email":
    case "correo":
      return "Correo electrónico";
    case "whatsapp":
      return "WhatsApp";
    default:
      return value;
  }
}

// Chip de estado
function StatusChip({ active }: { active: boolean }) {
  return (
    <Chip
      size="small"
      label={active ? "Activo" : "Inactivo"}
      color={active ? "success" : "default"}
      variant={active ? "filled" : "outlined"}
    />
  );
}

type Page<T> = {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
};

/* =======================
 *   Página principal
 * ======================= */

export default function AlertasRecordatoriosPage() {
  const [tab, setTab] = useState(0);

  useEffect(() => {
    document.title = "Alertas y Recordatorios";
  }, []);

  return (
    <AppLayout >
      <Box sx={{ p: 3 }}>
        {/* Encabezado (similar al de EmbudoVentas) */}
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
          >
            <Box>
              <Typography variant="h5" fontWeight={800}>
                Alertas y Recordatorios
              </Typography>
              <Breadcrumbs sx={{ mt: 0.5 }}>
                <Typography color="text.secondary">Pipeline comercial</Typography>
                <Typography color="text.primary">
                  Alertas y Recordatorios
                </Typography>
              </Breadcrumbs>
            </Box>
            <Avatar
              src="/marca-secundaria.png"
              sx={{ width: 72, height: 72 }}
            />
          </Stack>
        </Paper>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Recordatorios" />
          <Tab label="Alertas del Sistema" />
        </Tabs>

        {tab === 0 ? <RecordatoriosTable /> : <AlertasTable />}
      </Box>
    </AppLayout>
  );
}

/* =======================
 *       RECORDATORIOS
 *       (con proximaEjecucion)
 * ======================= */

function RecordatoriosTable() {
  const [page, setPage] = useState<Page<AlertItem>>({
    content: [],
    totalElements: 0,
    number: 0,
    size: 10,
  });
  const [loading, setLoading] = useState(false);
  const [onlyActive, setOnlyActive] = useState(true);
  const [modal, setModal] = useState<{
    open: boolean;
    data?: Partial<AlertItem>;
  }>({
    open: false,
  });

  const load = async (p = 0) => {
    setLoading(true);
    try {
      // Filtramos por activos si es necesario
      const data = await listAlerts({
        // si tu backend soporta este filtro
        // @ts-ignore (si aún no está en la interfaz de params)
        activo: onlyActive ? true : undefined,
        page: p,
        size: page.size,
      });

      // Solo mostramos los que tienen proximaEjecucion (son recordatorios)
      const filtered = {
        ...data,
        content: data.content.filter((a) => a.proximaEjecucion),
        totalElements: data.content.filter((a) => a.proximaEjecucion).length,
      };

      setPage(filtered);
    } catch (error) {
      console.error("Error cargando recordatorios:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyActive]);

  const save = async (data: Partial<AlertItem>) => {
    try {
      if (data.id) {
        await updateAlert(data.id, data);
      } else {
        await createAlert(data);
      }
      setModal({ open: false });
      load(page.number);
    } catch (error) {
      console.error("Error guardando recordatorio:", error);
    }
  };

  const handleToggle = async (id: number, currentActive: boolean) => {
    try {
      // @ts-ignore si "activo" no está aún en la interfaz
      await updateAlert(id, { activo: !currentActive });
      load(page.number);
    } catch (error) {
      console.error("Error cambiando estado:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("¿Eliminar este recordatorio?")) return;
    try {
      await deleteAlert(id);
      load(page.number);
    } catch (error) {
      console.error("Error eliminando:", error);
    }
  };

  const canPrev = page.number > 0;
  const canNext = (page.number + 1) * page.size < page.totalElements;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <TextField
          select
          size="small"
          label="Solo activos"
          value={onlyActive ? "SI" : "NO"}
          onChange={(e) => setOnlyActive(e.target.value === "SI")}
          sx={{ width: 160 }}
        >
          <MenuItem value="SI">Sí</MenuItem>
          <MenuItem value="NO">No</MenuItem>
        </TextField>
        <Button
          startIcon={<Add />}
          variant="contained"
          onClick={() => setModal({ open: true })}
        >
          Nuevo recordatorio
        </Button>
      </Stack>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #eef2f7",
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "grey.50" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Título</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Próxima ejecución</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Repetición</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Canal</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            )}

            {!loading && page.content.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  align="center"
                  sx={{ py: 6, color: "text.disabled" }}
                >
                  No hay recordatorios registrados
                </TableCell>
              </TableRow>
            )}

            {!loading &&
              page.content.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {row.titulo || row.title}
                  </TableCell>
                  <TableCell>
                    {row.proximaEjecucion
                      ? dayjs(row.proximaEjecucion).format(
                          "DD/MM/YYYY HH:mm"
                        )
                      : "-"}
                  </TableCell>
                  <TableCell>{formatRepeticion(row.repeticion)}</TableCell>
                  <TableCell>{formatCanal(row.canal)}</TableCell>
                  <TableCell>
                    {/* @ts-ignore si activo no está aún en AlertItem */}
                    <StatusChip active={row.activo ?? true} />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() =>
                          setModal({ open: true, data: row as AlertItem })
                        }
                        title="Editar"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        // @ts-ignore
                        onClick={() =>
                          handleToggle(row.id, row.activo ?? true)
                        }
                        // @ts-ignore
                        title={row.activo ? "Desactivar" : "Activar"}
                      >
                        <PauseCircle fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(row.id)}
                        title="Eliminar"
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>

        {/* Paginación */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 2,
            py: 2,
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "grey.50",
          }}
        >
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Página {page.number + 1} · {page.totalElements} registro(s)
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={<ArrowBackIosNew fontSize="inherit" />}
              disabled={!canPrev}
              onClick={() => canPrev && load(page.number - 1)}
            >
              Anterior
            </Button>
            <Button
              size="small"
              endIcon={<ArrowForwardIos fontSize="inherit" />}
              disabled={!canNext}
              onClick={() => canNext && load(page.number + 1)}
            >
              Siguiente
            </Button>
          </Stack>
        </Box>
      </TableContainer>

      <ReminderDialog
        open={modal.open}
        data={modal.data}
        onClose={() => setModal({ open: false })}
        onSave={save}
      />
    </Box>
  );
}

/* =======================
 *   Diálogo Recordatorio
 * ======================= */

function ReminderDialog({
  open,
  data,
  onClose,
  onSave,
}: {
  open: boolean;
  data?: Partial<AlertItem>;
  onClose: () => void;
  onSave: (d: Partial<AlertItem>) => void;
}) {
  const [form, setForm] = useState<Partial<AlertItem>>({
    title: "",
    message: "",
    proximaEjecucion: dayjs()
      .add(1, "hour")
      .second(0)
      .millisecond(0)
      .format("YYYY-MM-DDTHH:mm"),
    repeticion: "No se repite",
    canal: "En la app",
    // @ts-ignore
    activo: true,
  });

  useEffect(() => {
    if (open && data) {
      setForm({
        ...data,
        proximaEjecucion: data.proximaEjecucion
          ? dayjs(data.proximaEjecucion).format("YYYY-MM-DDTHH:mm")
          : dayjs().add(1, "hour").format("YYYY-MM-DDTHH:mm"),
      });
    } else if (open) {
      setForm({
        title: "",
        message: "",
        proximaEjecucion: dayjs()
          .add(1, "hour")
          .format("YYYY-MM-DDTHH:mm"),
        repeticion: "No se repite",
        canal: "En la app",
        // @ts-ignore
        activo: true,
      });
    }
  }, [open, data]);

  const handleSave = () => {
    const payload: Partial<AlertItem> = {
      ...form,
      proximaEjecucion: form.proximaEjecucion
        ? dayjs(form.proximaEjecucion).format("YYYY-MM-DDTHH:mm:ss")
        : undefined,
    };
    onSave(payload);
  };


  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {form.id ? "Editar recordatorio" : "Nuevo recordatorio"}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Título"
            value={form.title || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, title: e.target.value }))
            }
            fullWidth
            required
          />
          <TextField
            label="Descripción / Mensaje"
            value={form.message || (form as any).descripcion || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, message: e.target.value }))
            }
            multiline
            rows={3}
            fullWidth
          />
          <TextField
            type="datetime-local"
            label="Fecha y hora de ejecución"
            value={form.proximaEjecucion || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, proximaEjecucion: e.target.value }))
            }
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth>
            <InputLabel>Repetición</InputLabel>
            <Select
              label="Repetición"
              value={form.repeticion || "No se repite"}
              onChange={(e) =>
                setForm((f) => ({ ...f, repeticion: e.target.value }))
              }
            >
              <MenuItem value="No se repite">No se repite</MenuItem>
              <MenuItem value="Diario">Diariamente</MenuItem>
              <MenuItem value="Semanal">Semanalmente</MenuItem>
              <MenuItem value="Mensual">Mensualmente</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Canal</InputLabel>
            <Select
              label="Canal"
              value={form.canal || "En la app"}
              onChange={(e) =>
                setForm((f) => ({ ...f, canal: e.target.value }))
              }
            >
              <MenuItem value="En la app">En la app</MenuItem>
              <MenuItem value="Email">Correo electrónico</MenuItem>
              <MenuItem value="WhatsApp">WhatsApp</MenuItem>
            </Select>
          </FormControl>
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={1}
            sx={{ mt: 2 }}
          >
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!form.title}
            >
              Guardar
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

/* =======================
 *  ALERTAS DEL SISTEMA
 *  (sin proximaEjecucion)
 * ======================= */

function AlertasTable() {
  const [page, setPage] = useState<Page<AlertItem>>({
    content: [],
    totalElements: 0,
    number: 0,
    size: 10,
  });
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{
    open: boolean;
    data?: Partial<AlertItem>;
  }>({
    open: false,
  });

  const load = async (p = 0) => {
    setLoading(true);
    try {
      const data = await listAlerts({ all: true, page: p, size: page.size });

      // Solo mostramos las que NO tienen proximaEjecucion (son alertas del sistema)
      const filtered = {
        ...data,
        content: data.content.filter((a) => !a.proximaEjecucion),
        totalElements: data.content.filter((a) => !a.proximaEjecucion).length,
      };

      setPage(filtered);
    } catch (error) {
      console.error("Error cargando alertas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (data: Partial<AlertItem>) => {
    try {
      // Asegurar que NO tenga proximaEjecucion
      const payload = { ...data, proximaEjecucion: undefined };
      await createAlert(payload);
      setModal({ open: false });
      load(page.number);
    } catch (error) {
      console.error("Error guardando alerta:", error);
    }
  };

  const canPrev = page.number > 0;
  const canNext = (page.number + 1) * page.size < page.totalElements;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="flex-end"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Button
          startIcon={<Add />}
          variant="contained"
          onClick={() => setModal({ open: true })}
        >
          Nueva alerta
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: "1px solid #eef2f7",
          overflow: "hidden",
        }}
      >
        {loading && (
          <Box
            sx={{
              p: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress size={28} />
          </Box>
        )}

        {!loading && page.content.length === 0 && (
          <Box sx={{ p: 6, textAlign: "center", color: "text.disabled" }}>
            No hay alertas del sistema
          </Box>
        )}

        {!loading &&
          page.content.map((a, idx) => (
            <Box
              key={a.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                px: 2,
                py: 2,
                borderTop: idx === 0 ? 0 : 1,
                borderColor: "divider",
                bgcolor: a.readAt ? "transparent" : "action.hover",
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600 }}
                >
                  {a.title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    wordBreak: "break-word",
                  }}
                >
                  {a.message}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.disabled" }}>
                  {dayjs(a.createdAt).format("DD/MM/YYYY HH:mm")}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0, ml: 2 }}>
                {!a.readAt && (
                  <Button
                    size="small"
                    onClick={() =>
                      markAlertRead(a.id).then(() => load(page.number))
                    }
                  >
                    Marcar como leída
                  </Button>
                )}
                {a.readAt && (
                  <Chip label="Leída" size="small" color="default" />
                )}
              </Stack>
            </Box>
          ))}

        {/* Paginación */}
        {page.content.length > 0 && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 2,
              py: 2,
              borderTop: 1,
              borderColor: "divider",
              bgcolor: "grey.50",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Página {page.number + 1} · {page.totalElements} alerta(s)
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                startIcon={<ArrowBackIosNew fontSize="inherit" />}
                disabled={!canPrev}
                onClick={() => canPrev && load(page.number - 1)}
              >
                Anterior
              </Button>
              <Button
                size="small"
                endIcon={<ArrowForwardIos fontSize="inherit" />}
                disabled={!canNext}
                onClick={() => canNext && load(page.number + 1)}
              >
                Siguiente
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>

      <AlertDialog
        open={modal.open}
        data={modal.data}
        onClose={() => setModal({ open: false })}
        onSave={save}
      />
    </Box>
  );
}

/* =======================
 *   Diálogo Alerta Simple
 * ======================= */

function AlertDialog({
  open,
  data,
  onClose,
  onSave,
}: {
  open: boolean;
  data?: Partial<AlertItem>;
  onClose: () => void;
  onSave: (d: Partial<AlertItem>) => void;
}) {
  const [form, setForm] = useState<Partial<AlertItem>>({
    title: "",
    message: "",
  });

  useEffect(() => {
    if (open && data) {
      setForm(data);
    } else if (open) {
      setForm({ title: "", message: "" });
    }
  }, [open, data]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nueva alerta</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Título"
            value={form.title || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, title: e.target.value }))
            }
            fullWidth
            required
          />
          <TextField
            label="Mensaje"
            value={form.message || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, message: e.target.value }))
            }
            multiline
            rows={4}
            fullWidth
            required
          />
          <Stack
            direction="row"
            justifyContent="flex-end"
            spacing={1}
            sx={{ mt: 2 }}
          >
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={() => onSave(form)}
              disabled={!form.title || !form.message}
            >
              Guardar
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
