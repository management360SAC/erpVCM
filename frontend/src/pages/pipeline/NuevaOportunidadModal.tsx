// src/pages/pipeline/NuevaOportunidadModal.tsx
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
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { getClients, type ClientResponse } from "../../apis/client";
import { getServices, type ServiceResponse } from "../../apis/service";
import type { Stage } from "./EmbudoVentas";

const STAGE_OPTIONS: { value: Stage; label: string }[] = [
  { value: "PROSPECTO", label: "Prospecto" },
  { value: "CONTACTO", label: "Contacto" },
  { value: "CALIFICADO", label: "Calificado" },
  { value: "PROPUESTA", label: "Propuesta" },
];

export interface NuevaOportunidadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function NuevaOportunidadModal({ open, onClose, onCreated }: NuevaOportunidadModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [stage, setStage] = useState<Stage>("PROSPECTO");

  // Cliente: existente (Autocomplete) o nuevo (freeSolo -> se registra al vuelo)
  const [client, setClient] = useState<ClientResponse | null>(null);
  const [clientName, setClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientTaxId, setNewClientTaxId] = useState("");

  const [clientsList, setClientsList] = useState<ClientResponse[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Servicio de interés (opcional)
  const [serviceId, setServiceId] = useState<number | "">("");
  const [servicesList, setServicesList] = useState<ServiceResponse[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    // reset al abrir
    setTitle("");
    setAmount("");
    setCurrency("PEN");
    setStage("PROSPECTO");
    setClient(null);
    setClientName("");
    setNewClientEmail("");
    setNewClientPhone("");
    setNewClientTaxId("");
    setServiceId("");
    setErrorMsg("");

    (async () => {
      try {
        setLoadingClients(true);
        const data = await getClients();
        setClientsList(data || []);
      } finally {
        setLoadingClients(false);
      }
    })();

    (async () => {
      try {
        setLoadingServices(true);
        const data = await getServices({ onlyActive: true });
        setServicesList(data || []);
      } finally {
        setLoadingServices(false);
      }
    })();
  }, [open]);

  const sortedClients = useMemo(
    () =>
      [...clientsList].sort((a, b) =>
        (a.legalName || "").localeCompare(b.legalName || "", "es", { sensitivity: "base" })
      ),
    [clientsList]
  );

  // Es cliente nuevo si el usuario escribió un nombre que no corresponde al cliente seleccionado
  const isNewClient = !client && clientName.trim().length > 0;

  const handleSelectClient = (value: string | ClientResponse | null) => {
    if (typeof value === "string") {
      setClient(null);
      setClientName(value);
    } else if (value) {
      setClient(value);
      setClientName(value.legalName || "");
    } else {
      setClient(null);
      setClientName("");
    }
  };

  const canSave = title.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!title.trim()) {
      setErrorMsg("El título de la oportunidad es requerido.");
      return;
    }
    try {
      setSaving(true);
      setErrorMsg("");
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
      const res = await fetch(`/api/deals`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          clientId: client?.id ?? null,
          newClient: isNewClient
            ? {
                legalName: clientName.trim(),
                email: newClientEmail || null,
                phone: newClientPhone || null,
                taxId: newClientTaxId || null,
              }
            : null,
          serviceId: serviceId || null,
          amount: amount ? Number(amount) : null,
          currency,
          stage,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "No se pudo crear la oportunidad.");
      }
      onCreated();
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo crear la oportunidad.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800 }}>Nueva Oportunidad</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          <TextField
            label="Título de la oportunidad"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            autoFocus
            required
          />

          <Autocomplete
            freeSolo
            options={sortedClients}
            loading={loadingClients}
            getOptionLabel={(o) => (typeof o === "string" ? o : o.legalName || "")}
            value={client || clientName}
            onChange={(_, val) => handleSelectClient(val)}
            onInputChange={(_, val, reason) => {
              if (reason === "input") {
                setClient(null);
                setClientName(val);
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cliente (opcional — escribe un nombre nuevo para registrarlo)"
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

          {isNewClient && (
            <Stack spacing={1.5} sx={{ p: 1.5, borderRadius: 2, border: "1px dashed #dbe3ef", background: "#fbfdff" }}>
              <Typography variant="caption" color="text.secondary">
                "{clientName}" no está registrado. Se creará automáticamente como cliente nuevo al guardar la oportunidad.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  size="small"
                  label="Correo (opcional)"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small"
                  label="Teléfono (opcional)"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  fullWidth
                />
                <TextField
                  size="small"
                  label="RUC (opcional)"
                  value={newClientTaxId}
                  onChange={(e) => setNewClientTaxId(e.target.value.replace(/\D/g, ""))}
                  fullWidth
                />
              </Stack>
            </Stack>
          )}

          <TextField
            select
            label="Servicio de interés (opcional)"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value ? Number(e.target.value) : "")}
            fullWidth
            InputProps={{
              endAdornment: loadingServices ? <CircularProgress size={18} sx={{ mr: 2 }} /> : undefined,
            }}
          >
            <MenuItem value="">Sin especificar</MenuItem>
            {servicesList.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Monto estimado"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              inputProps={{ inputMode: "decimal" }}
              fullWidth
            />
            <TextField select label="Moneda" value={currency} onChange={(e) => setCurrency(e.target.value as "PEN" | "USD")} sx={{ minWidth: { sm: 160 } }} fullWidth>
              <MenuItem value="PEN">Soles (PEN)</MenuItem>
              <MenuItem value="USD">Dólares (USD)</MenuItem>
            </TextField>
          </Stack>

          <TextField select label="Etapa inicial" value={stage} onChange={(e) => setStage(e.target.value as Stage)} fullWidth>
            {STAGE_OPTIONS.map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave}>
          {saving ? "Guardando..." : "Crear Oportunidad"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
