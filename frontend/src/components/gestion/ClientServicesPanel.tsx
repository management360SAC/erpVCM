// src/pages/clients/ClientServicesPanel.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Paper, Stack, Box, Typography, Button, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControlLabel, Switch, MenuItem, Select, InputLabel, FormControl
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";

import {
  getClientServices,
  attachClientService,       // <- corregido
  updateClientService,       // <- firma correcta (clientServiceId, payload)
  detachClientService,       // <- corregido (DELETE por clientId + serviceId)
  type ClientServiceDTO,
} from "../../apis/clientService";

import { getServices, type ServiceResponse } from "../../apis/service";

export default function ClientServicesPanel({ clientId }: { clientId: number }) {
  const [rows, setRows] = useState<ClientServiceDTO[]>([]);
  const [onlyActive, setOnlyActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Dialog "Agregar servicio"
  const [open, setOpen] = useState(false);
  const [catalog, setCatalog] = useState<ServiceResponse[]>([]);
  const [selServiceId, setSelServiceId] = useState<number | "">("");
  const [price, setPrice] = useState<string>("");

  const load = async () => {
    try {
      setErr(null);
      setLoading(true);
      const data = await getClientServices(clientId, onlyActive);
      setRows(data);
    } catch (e: any) {
      console.error(e);
      setErr("No se pudo cargar servicios del cliente.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [clientId, onlyActive]);

  const openAdd = async () => {
    try {
      setErr(null);
      const cats = await getServices({ onlyActive: true });
      setCatalog(cats);
      setSelServiceId("");
      setPrice("");
      setOpen(true);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el catálogo de servicios.");
    }
  };

  const saveAdd = async () => {
    if (!selServiceId) return;
    try {
      await attachClientService(
        clientId,
        Number(selServiceId),
        {
          clientId,
          serviceId: Number(selServiceId),
          price: price ? Number(price) : undefined,
          isActive: true,
        } as ClientServiceDTO
      );
      setOpen(false);
      load();
    } catch (e) {
      console.error(e);
      setErr("No se pudo agregar el servicio al cliente.");
    }
  };

  const toggleActive = async (r: ClientServiceDTO) => {
    try {
      // PATCH /client-services/{clientServiceId}
      await updateClientService(r.id!, { isActive: !r.isActive });
      load();
    } catch (e) {
      console.error(e);
      setErr("No se pudo cambiar el estado del servicio.");
    }
  };

  const softDelete = async (r: ClientServiceDTO) => {
    try {
      // DELETE /client-services/{clientId}/{serviceId}
      await detachClientService(clientId, r.serviceId);
      load();
    } catch (e) {
      console.error(e);
      setErr("No se pudo desactivar el servicio.");
    }
  };

  const data = useMemo(() => rows, [rows]);

  return (
    <Paper elevation={0} sx={{ mt: 3, p: 2.5, borderRadius: 3, border: "1px solid #eef2f7" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight={800}>Servicios del cliente</Typography>

        <Stack direction="row" spacing={1.5}>
          <FormControlLabel
            control={
              <Switch
                checked={onlyActive}
                onChange={(_, v) => setOnlyActive(v)}
              />
            }
            label="Solo activos"
          />

          <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load} disabled={loading}>
            Actualizar
          </Button>
          <Button startIcon={<AddIcon />} variant="contained" onClick={openAdd}>
            Agregar servicio
          </Button>
        </Stack>
      </Stack>

      {err && <Typography color="error" variant="body2" sx={{ mb: 1 }}>{err}</Typography>}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Servicio</TableCell>
              <TableCell>Modelo</TableCell>
              <TableCell align="right">Precio base</TableCell>
              <TableCell align="right">Precio pactado</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && data.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                    Sin resultados
                  </Box>
                </TableCell>
              </TableRow>
            )}
            {loading && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box sx={{ py: 4, textAlign: "center" }}>Cargando...</Box>
                </TableCell>
              </TableRow>
            )}
            {!loading && data.map((r, idx) => (
              <TableRow key={r.id} hover>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{r.serviceName}</TableCell>
                <TableCell>{r.billingModel}</TableCell>
                <TableCell align="right">{r.basePrice ?? "-"}</TableCell>
                <TableCell align="right">{r.price ?? "-"}</TableCell>
                <TableCell>
                  <Chip
                    label={r.isActive ? "ACTIVO" : "INACTIVO"}
                    size="small"
                    color={r.isActive ? "success" : "default"}
                    onClick={() => toggleActive(r)}
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => softDelete(r)} title="Desactivar">
                    <DeleteOutlineIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog agregar */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Agregar servicio al cliente</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Servicio</InputLabel>
              <Select
                label="Servicio"
                value={selServiceId}
                onChange={(e) => setSelServiceId(e.target.value as number)}
              >
                {catalog.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Precio pactado (opcional)"
              size="small"
              type="number"
              inputProps={{ step: "0.01", min: 0 }}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveAdd} disabled={!selServiceId}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
