// src/pages/gestion/ProyectoFormModal.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getClients, type ClientResponse } from "../../apis/client";

export type ProjectStatus = "PENDIENTE" | "EN_EJECUCION" | "PAUSADO" | "COMPLETADO" | "CANCELADO";

export type ProjectFormValue = {
  id?: number;
  name: string;
  clientId?: number | null;
  clientName?: string | null;
  ownerName?: string | null;
  budgetTotal?: number | null;
  progress?: number | null;
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
};

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_EJECUCION", label: "En ejecución" },
  { value: "PAUSADO", label: "Pausado" },
  { value: "COMPLETADO", label: "Completado" },
  { value: "CANCELADO", label: "Cancelado" },
];

async function saveProject(value: ProjectFormValue): Promise<void> {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const payload = {
    name: value.name.trim(),
    clientId: value.clientId ?? null,
    ownerName: value.ownerName || null,
    budgetTotal: value.budgetTotal ?? null,
    progress: value.progress ?? 0,
    status: value.status,
    startDate: value.startDate || null,
    endDate: value.endDate || null,
  };
  const url = value.id ? `/api/projects/${value.id}` : `/api/projects`;
  const method = value.id ? "PUT" : "POST";
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "No se pudo guardar el proyecto.");
  }
}

export interface ProyectoFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: ProjectFormValue | null; // null/undefined = crear
}

const EMPTY: ProjectFormValue = {
  name: "",
  clientId: null,
  ownerName: "",
  budgetTotal: null,
  progress: 0,
  status: "PENDIENTE",
  startDate: "",
  endDate: "",
};

export default function ProyectoFormModal({ open, onClose, onSaved, initial }: ProyectoFormModalProps) {
  const isEdit = !!initial?.id;
  const [value, setValue] = useState<ProjectFormValue>(EMPTY);
  const [client, setClient] = useState<ClientResponse | null>(null);
  const [clientsList, setClientsList] = useState<ClientResponse[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setValue(initial ? { ...initial } : { ...EMPTY });
    setErrorMsg("");

    (async () => {
      try {
        setLoadingClients(true);
        const data = await getClients();
        setClientsList(data || []);
        if (initial?.clientId) {
          setClient((data || []).find((c) => c.id === initial.clientId) || null);
        } else {
          setClient(null);
        }
      } finally {
        setLoadingClients(false);
      }
    })();
  }, [open, initial]);

  const sortedClients = useMemo(
    () => [...clientsList].sort((a, b) => (a.legalName || "").localeCompare(b.legalName || "", "es", { sensitivity: "base" })),
    [clientsList]
  );

  const canSave = value.name.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!value.name.trim()) {
      setErrorMsg("El nombre del proyecto es requerido.");
      return;
    }
    try {
      setSaving(true);
      setErrorMsg("");
      await saveProject({ ...value, clientId: client?.id ?? null });
      onSaved();
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo guardar el proyecto.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>{isEdit ? "Editar Proyecto" : "Nuevo Proyecto"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <TextField
            label="Nombre del proyecto"
            value={value.name}
            onChange={(e) => setValue((v) => ({ ...v, name: e.target.value }))}
            fullWidth
            autoFocus
            required
          />

          <Autocomplete
            options={sortedClients}
            loading={loadingClients}
            getOptionLabel={(o) => o.legalName || ""}
            value={client}
            onChange={(_, val) => setClient(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cliente (opcional)"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingClients ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />

          <TextField
            label="Responsable"
            value={value.ownerName || ""}
            onChange={(e) => setValue((v) => ({ ...v, ownerName: e.target.value }))}
            fullWidth
          />

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Monto total (S/)"
              value={value.budgetTotal ?? ""}
              onChange={(e) => setValue((v) => ({ ...v, budgetTotal: e.target.value ? Number(e.target.value.replace(/[^0-9.]/g, "")) : null }))}
              inputProps={{ inputMode: "decimal" }}
              fullWidth
            />
            <TextField
              select
              label="Estado"
              value={value.status}
              onChange={(e) => setValue((v) => ({ ...v, status: e.target.value as ProjectStatus }))}
              fullWidth
            >
              {STATUS_OPTIONS.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </TextField>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Fecha de inicio"
              type="date"
              value={value.startDate || ""}
              onChange={(e) => setValue((v) => ({ ...v, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Fecha de fin"
              type="date"
              value={value.endDate || ""}
              onChange={(e) => setValue((v) => ({ ...v, endDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>

          <Stack spacing={0.5}>
            <Typography variant="body2" color="text.secondary">
              Avance: {value.progress ?? 0}%
            </Typography>
            <Slider
              value={value.progress ?? 0}
              onChange={(_, v) => setValue((val) => ({ ...val, progress: v as number }))}
              step={5}
              min={0}
              max={100}
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave}>
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear Proyecto"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
