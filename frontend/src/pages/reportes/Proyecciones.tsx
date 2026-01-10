// src/pages/reportes/Proyecciones.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Alert, Avatar, Box, Breadcrumbs, Button, FormControl, InputLabel, MenuItem,
  Paper, Select, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, Typography, CircularProgress
} from "@mui/material";
import AppLayout from "../../layout/AppLayout";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

type ProjectionPoint = { x: string; base: number; optimista: number; pesimista: number };
type ProjectionRow = { month: string; base: number; optimista: number; pesimista: number };

type ProjResp = {
  horizon: number;
  series: ProjectionPoint[];
  table: ProjectionRow[];
  totalBase: number;
};

const PEN = (v: number) =>
  `S/ ${Number(v || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const msg = async (r: Response) => { try{const j=await r.json();return j?.message || r.statusText;}catch{return r.statusText;} };

async function fetchProjections(h: number): Promise<ProjResp> {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const r = await fetch(`/api/analytics/projections?horizon=${h}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(await msg(r));
  return r.json();
}

export default function Proyecciones() {
  const [horizon, setHorizon] = useState(6);
  const [data, setData] = useState<ProjResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function load(h: number) {
    try {
      setLoading(true);
      setErrorMsg("");
      const d = await fetchProjections(h);
      setData(d);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudieron cargar las proyecciones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Proyecciones";
    if (!localStorage.getItem("accessToken") && !localStorage.getItem("token")) return;
    load(horizon);
  }, [horizon]);

  const rows = data?.table || [];
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const paged = useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage]
  );

  return (
    <AppLayout title="Proyecciones">
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #eef2f7", background: "#eef6ff" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>Proyecciones</Typography>
            <Breadcrumbs sx={{ mt: .5 }}>
              <Typography color="text.secondary">Reportes & Analítica</Typography>
              <Typography color="text.primary">Proyecciones</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>Horizonte</InputLabel>
          <Select label="Horizonte" value={horizon} onChange={(e)=>{ setHorizon(Number(e.target.value)); setPage(0); }}>
            <MenuItem value={3}>3 meses</MenuItem>
            <MenuItem value={6}>6 meses</MenuItem>
            <MenuItem value={12}>12 meses</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" onClick={()=>load(horizon)} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
      </Stack>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

      {loading ? (
        <Box sx={{ textAlign:"center", py:6 }}><CircularProgress/></Box>
      ) : (
        <>
          <Paper elevation={0} sx={{ p: 2, mb: 2, border: "1px solid #eef2f7", borderRadius: 3 }}>
            <Typography fontWeight={700} sx={{ mb: 1 }}>Proyección de Ingresos</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data?.series || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="x" />
                <YAxis />
                <Tooltip formatter={(v)=>PEN(Number(v))}/>
                <Legend />
                <Area type="monotone" dataKey="base" name="Base" />
                <Area type="monotone" dataKey="optimista" name="Optimista" />
                <Area type="monotone" dataKey="pesimista" name="Pesimista" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>

          <Paper elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Mes</TableCell>
                    <TableCell align="right">Base</TableCell>
                    <TableCell align="right">Optimista</TableCell>
                    <TableCell align="right">Pesimista</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paged.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.month}</TableCell>
                      <TableCell align="right">{PEN(r.base)}</TableCell>
                      <TableCell align="right">{PEN(r.optimista)}</TableCell>
                      <TableCell align="right">{PEN(r.pesimista)}</TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4, color: "text.secondary" }}>
                        No hay datos para mostrar
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              rowsPerPageOptions={[6, 12, 24]}
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e)=>{ setRowsPerPage(parseInt(e.target.value,10)); setPage(0); }}
            />
          </Paper>
        </>
      )}
    </AppLayout>
  );
}
