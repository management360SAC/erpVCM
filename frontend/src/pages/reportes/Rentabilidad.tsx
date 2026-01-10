// src/pages/reportes/Rentabilidad.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Alert, Avatar, Box, Breadcrumbs, FormControl, InputLabel, MenuItem, Paper, Select, Button,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
  TextField, Typography, CircularProgress
} from "@mui/material";
import AppLayout from "../../layout/AppLayout";

type Row = {
  id: number;
  project: string;
  client?: string | null;
  revenue: number;     // ingresos
  cost: number;        // costos
  margin: number;      // revenue - cost
  marginPct: number;   // 0..1
  owner?: string | null;
  status?: "EN_EJECUCION" | "COMPLETADO" | "PAUSADO" | "CANCELADO";
};

type ProfitResp = { rows: Row[]; totalRev: number; totalCost: number; totalMargin: number; };

const PEN = (v: number) => `S/ ${Number(v || 0).toLocaleString("es-PE",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const PCT = (v: number) => `${(Number(v||0)*100).toFixed(1)}%`;
const msg = async (r: Response) => { try{const j=await r.json();return j?.message || r.statusText;}catch{return r.statusText;} };

async function fetchProfit(params: { q?: string; status?: string }) : Promise<ProfitResp> {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const qs = new URLSearchParams();
  if (params.q) qs.set("q", params.q);
  if (params.status && params.status !== "TODOS") qs.set("status", params.status);
  const r = await fetch(`/api/analytics/profitability?${qs.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(await msg(r));
  return r.json();
}

export default function Rentabilidad() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [status, setStatus] = useState<"TODOS" | NonNullable<Row["status"]>>("TODOS");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [totRev, setTotRev] = useState(0);
  const [totCost, setTotCost] = useState(0);
  const [totMargin, setTotMargin] = useState(0);

  useEffect(() => {
    const t = setTimeout(()=>setDebouncedQ(q), 350);
    return ()=>clearTimeout(t);
  }, [q]);

  async function load() {
    try {
      setLoading(true);
      setErrorMsg("");
      const d = await fetchProfit({ q: debouncedQ.trim() || undefined, status });
      setRows(d.rows || []);
      setTotRev(d.totalRev || 0);
      setTotCost(d.totalCost || 0);
      setTotMargin(d.totalMargin || 0);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo cargar rentabilidad");
      setRows([]); setTotRev(0); setTotCost(0); setTotMargin(0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Rentabilidad";
    if (!localStorage.getItem("accessToken") && !localStorage.getItem("token")) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, status]);

  const filtered = useMemo(() => rows, [rows]); // server-side ya filtra

  const paged = useMemo(
    () => filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filtered, page, rowsPerPage]
  );

  return (
    <AppLayout title="Rentabilidad">
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #eef2f7", background: "#eef6ff" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>Rentabilidad</Typography>
            <Breadcrumbs sx={{ mt: .5 }}>
              <Typography color="text.secondary">Reportes & Analítica</Typography>
              <Typography color="text.primary">Rentabilidad</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {/* Filtros */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <TextField
          size="small"
          placeholder="Buscar por proyecto o cliente"
          value={q}
          onChange={(e)=>{ setQ(e.target.value); setPage(0); }}
          sx={{ width: 360 }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Estado</InputLabel>
          <Select label="Estado" value={status} onChange={(e)=>{ setStatus(e.target.value as any); setPage(0); }}>
            <MenuItem value="TODOS">Todos</MenuItem>
            <MenuItem value="EN_EJECUCION">En ejecución</MenuItem>
            <MenuItem value="COMPLETADO">Completado</MenuItem>
            <MenuItem value="PAUSADO">Pausado</MenuItem>
            <MenuItem value="CANCELADO">Cancelado</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" onClick={load} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
      </Stack>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
      {loading && <Box sx={{ textAlign:"center", py:6 }}><CircularProgress/></Box>}

      {!loading && (
        <Paper elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Proyecto</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell align="right">Ingresos</TableCell>
                  <TableCell align="right">Costos</TableCell>
                  <TableCell align="right">Margen</TableCell>
                  <TableCell align="right">% Margen</TableCell>
                  <TableCell>Responsable</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paged.map((r, i) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                    <TableCell>{r.project}</TableCell>
                    <TableCell>{r.client || "—"}</TableCell>
                    <TableCell align="right">{PEN(r.revenue)}</TableCell>
                    <TableCell align="right">{PEN(r.cost)}</TableCell>
                    <TableCell align="right">{PEN(r.margin)}</TableCell>
                    <TableCell align="right">{PCT(r.marginPct)}</TableCell>
                    <TableCell>{r.owner || "—"}</TableCell>
                    <TableCell>{r.status || "—"}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No hay datos para mostrar
                    </TableCell>
                  </TableRow>
                )}
                {/* Totales */}
                {filtered.length > 0 && (
                  <TableRow selected>
                    <TableCell colSpan={3}><b>Totales</b></TableCell>
                    <TableCell align="right"><b>{PEN(totRev)}</b></TableCell>
                    <TableCell align="right"><b>{PEN(totCost)}</b></TableCell>
                    <TableCell align="right"><b>{PEN(totMargin)}</b></TableCell>
                    <TableCell align="right"><b>{PCT(totRev ? (totMargin / totRev) : 0)}</b></TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            rowsPerPageOptions={[5, 10, 20, 50]}
            count={filtered.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p)=>setPage(p)}
            onRowsPerPageChange={(e)=>{ setRowsPerPage(parseInt(e.target.value,10)); setPage(0); }}
          />
        </Paper>
      )}
    </AppLayout>
  );
}
