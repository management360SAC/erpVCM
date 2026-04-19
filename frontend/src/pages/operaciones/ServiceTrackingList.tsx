// frontend/src/pages/operaciones/ServiceTrackingList.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Paper, Stack, Box, Typography, Select, MenuItem, FormControl, InputLabel,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, TextField, Button, CircularProgress
} from "@mui/material";
import AppLayout from "../../layout/AppLayout";
import { getExpiring, type ServiceExpiryRow } from "../../apis/serviceTracking";
import RefreshIcon from "@mui/icons-material/Refresh";

function SevChip({ s }: { s: ServiceExpiryRow }) {
  const label = s.severity === "EXPIRED" ? "VENCIDO"
              : s.severity === "CRITICAL" ? "CRÍTICO"
              : s.severity === "WARN" ? "PRÓX VENCER" : "OK";
  const color = s.severity === "EXPIRED" ? "error"
              : s.severity === "CRITICAL" ? "error"
              : s.severity === "WARN" ? "warning" : "success";
  return <Chip size="small" color={color as any} label={label} />;
}

export default function ServiceTrackingList() {
  const [rows, setRows] = useState<ServiceExpiryRow[]>([]);
  const [withinDays, setWithinDays] = useState(30);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await getExpiring(withinDays);
      setRows(data);
    } catch (e: any) {
      // 403 → falta de permisos/rol; 401 → token inválido
      setErr(e?.response?.data?.message || e?.message || "Error al cargar");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [withinDays]);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return rows.filter(r =>
      r.clientName.toLowerCase().includes(t) ||
      r.serviceName.toLowerCase().includes(t)
    );
  }, [rows, q]);

  return (
    <AppLayout >
      <Paper elevation={0} sx={{ p:2.5, mb:2, borderRadius:3, border:"1px solid #fed7aa", background:"#fff7ed" }}>
        <Typography variant="h5" fontWeight={800}>Seguimiento de Servicios</Typography>
      </Paper>

      <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
        <TextField size="small" placeholder="Buscar cliente/servicio" value={q} onChange={e=>setQ(e.target.value)} />
        <FormControl size="small">
          <InputLabel>Ventana</InputLabel>
          <Select value={withinDays} label="Ventana" onChange={e=>setWithinDays(Number(e.target.value))}>
            <MenuItem value={7}>7 días</MenuItem>
            <MenuItem value={15}>15 días</MenuItem>
            <MenuItem value={30}>30 días</MenuItem>
            <MenuItem value={60}>60 días</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex:1 }} />
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
          {loading ? "Cargando..." : "Actualizar"}
        </Button>
      </Stack>

      {err && (
        <Box sx={{ color: "error.main", mb: 1 }}>
          {err}
        </Box>
      )}

      <Paper elevation={0} sx={{ border:"1px solid #eef2f7", borderRadius:3, position:"relative", minHeight: 120 }}>
        {loading && (
          <Box sx={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <Table size="medium" aria-disabled={loading}>
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700 } }}>
              <TableCell>#</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Servicio</TableCell>
              <TableCell>Inicio</TableCell>
              <TableCell>Fin</TableCell>
              <TableCell align="right">Días restantes</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r,i)=>(
              <TableRow key={r.clientServiceId} hover>
                <TableCell>{i+1}</TableCell>
                <TableCell>{r.clientName}</TableCell>
                <TableCell>{r.serviceName}</TableCell>
                <TableCell>{r.startDate ?? "-"}</TableCell>
                <TableCell>{r.endDate ?? "-"}</TableCell>
                <TableCell align="right">{r.daysRemaining === 9999 ? "-" : r.daysRemaining}</TableCell>
                <TableCell><SevChip s={r} /></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && !loading && (
              <TableRow><TableCell colSpan={7}>
                <Box sx={{ py:5, textAlign:"center", color:"text.secondary" }}>Sin resultados</Box>
              </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </AppLayout>
  );
}
