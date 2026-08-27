// src/pages/operaciones/CronogramaFormModal.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export type ScheduleStatus = "PENDIENTE" | "EN_EJECUCION" | "RETRASADO" | "COMPLETADO" | "CANCELADO";

export type TaskItem = { id?: number; name: string; done: boolean; dueDate?: string | null };

export type ScheduleFormValue = {
  id?: number;
  projectId?: number | null;
  projectName?: string | null;
  ownerName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: ScheduleStatus;
  tasks: TaskItem[];
};

type ProjectOption = { id: number; name: string; code: string };

const STATUS_OPTIONS: { value: ScheduleStatus; label: string }[] = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_EJECUCION", label: "En ejecución" },
  { value: "RETRASADO", label: "Retrasado" },
  { value: "COMPLETADO", label: "Completado" },
  { value: "CANCELADO", label: "Cancelado" },
];

const EMPTY: ScheduleFormValue = {
  projectId: null,
  ownerName: "",
  startDate: "",
  endDate: "",
  status: "PENDIENTE",
  tasks: [],
};

async function fetchProjects(): Promise<ProjectOption[]> {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/projects?page=0&size=200`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.content || []).map((p: any) => ({ id: p.id, name: p.name, code: p.code }));
}

async function saveSchedule(value: ScheduleFormValue): Promise<void> {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const payload = {
    projectId: value.projectId,
    ownerName: value.ownerName || null,
    startDate: value.startDate || null,
    endDate: value.endDate || null,
    status: value.status,
    tasks: value.tasks
      .filter((t) => t.name.trim())
      .map((t) => ({ id: t.id, name: t.name.trim(), done: t.done, dueDate: t.dueDate || null })),
  };
  const url = value.id ? `/api/schedules/${value.id}` : `/api/schedules`;
  const method = value.id ? "PUT" : "POST";
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "No se pudo guardar el cronograma.");
  }
}

export interface CronogramaFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: ScheduleFormValue | null;
}

export default function CronogramaFormModal({ open, onClose, onSaved, initial }: CronogramaFormModalProps) {
  const isEdit = !!initial?.id;
  const [value, setValue] = useState<ScheduleFormValue>(EMPTY);
  const [project, setProject] = useState<ProjectOption | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [newTaskName, setNewTaskName] = useState("");

  useEffect(() => {
    if (!open) return;
    setValue(initial ? { ...initial, tasks: initial.tasks.map((t) => ({ ...t })) } : { ...EMPTY, tasks: [] });
    setErrorMsg("");
    setNewTaskName("");

    (async () => {
      try {
        setLoadingProjects(true);
        const data = await fetchProjects();
        setProjects(data);
        if (initial?.projectId) {
          setProject(data.find((p) => p.id === initial.projectId) || null);
        } else {
          setProject(null);
        }
      } finally {
        setLoadingProjects(false);
      }
    })();
  }, [open, initial]);

  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" })),
    [projects]
  );

  const canSave = !!project && !saving;

  const addTask = () => {
    if (!newTaskName.trim()) return;
    setValue((v) => ({ ...v, tasks: [...v.tasks, { name: newTaskName.trim(), done: false, dueDate: null }] }));
    setNewTaskName("");
  };

  const removeTask = (idx: number) => {
    setValue((v) => ({ ...v, tasks: v.tasks.filter((_, i) => i !== idx) }));
  };

  const toggleTask = (idx: number) => {
    setValue((v) => ({
      ...v,
      tasks: v.tasks.map((t, i) => (i === idx ? { ...t, done: !t.done } : t)),
    }));
  };

  const handleSave = async () => {
    if (!project) {
      setErrorMsg("Selecciona el proyecto al que pertenece este cronograma.");
      return;
    }
    try {
      setSaving(true);
      setErrorMsg("");
      await saveSchedule({ ...value, projectId: project.id });
      onSaved();
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo guardar el cronograma.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>{isEdit ? "Editar Cronograma" : "Nuevo Cronograma"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <Autocomplete
            options={sortedProjects}
            loading={loadingProjects}
            disabled={isEdit}
            getOptionLabel={(o) => `${o.code} — ${o.name}`}
            value={project}
            onChange={(_, val) => setProject(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Proyecto"
                required
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingProjects ? <CircularProgress size={18} /> : null}
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

          <TextField
            select
            label="Estado"
            value={value.status}
            onChange={(e) => setValue((v) => ({ ...v, status: e.target.value as ScheduleStatus }))}
            fullWidth
          >
            {STATUS_OPTIONS.map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </TextField>

          <Stack spacing={1}>
            <Typography variant="subtitle2" fontWeight={700}>Tareas del cronograma</Typography>

            {value.tasks.map((t, idx) => (
              <Stack key={t.id ?? `new-${idx}`} direction="row" alignItems="center" spacing={1}>
                <Checkbox checked={t.done} onChange={() => toggleTask(idx)} size="small" />
                <TextField
                  size="small"
                  value={t.name}
                  onChange={(e) =>
                    setValue((v) => ({
                      ...v,
                      tasks: v.tasks.map((tt, i) => (i === idx ? { ...tt, name: e.target.value } : tt)),
                    }))
                  }
                  fullWidth
                />
                <IconButton size="small" onClick={() => removeTask(idx)}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
            ))}

            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                placeholder="Nueva tarea..."
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTask(); } }}
                fullWidth
              />
              <Button startIcon={<AddIcon />} onClick={addTask} disabled={!newTaskName.trim()}>
                Agregar
              </Button>
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave}>
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear Cronograma"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
