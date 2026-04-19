import { useEffect, useState } from "react";
import {
  Alert, Avatar, Box, Breadcrumbs, Button, CircularProgress, Paper, Stack, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, Typography
} from "@mui/material";
import AppLayout from "../../layout/AppLayout";
import WebAssetOutlinedIcon from "@mui/icons-material/WebAssetOutlined";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";

type Landing = { id: number; name: string; path: string; leads: number; convRate: number; updatedAt?: string|null };

export default function LandingsForm() {
  const [rows, setRows] = useState<Landing[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [page, setPage] = useState(0); const [rowsPerPage, setRowsPerPage] = useState(10);

  async function load() {
    try {
      setLoading(true); setErrorMsg("");
      // TODO: GET /api/marketing/landings
      setRows([]);
    } catch (e:any) { setErrorMsg(e?.message || "No se pudieron cargar landings"); }
    finally { setLoading(false); }
  }

  useEffect(() => { document.title = "Landing / Formularios"; load(); }, []);

  return (
    <AppLayout title="Landing / Formularios">
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #fed7aa", background: "#fff7ed" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>Landing / Formularios</Typography>
            <Breadcrumbs sx={{ mt: .5 }}>
              <Typography color="text.secondary">Marketing & Escalabilidad</Typography>
              <Typography color="text.primary">Landings</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Button variant="outlined" startIcon={<RefreshIcon/>} onClick={load} disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar"}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<AddIcon/>} onClick={()=>alert("Nueva landing/formulario")}>
          Nueva Landing
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}>
        <Table size="medium">
          <TableHead>
            <TableRow sx={{ "& th": { fontWeight: 700 } }}>
              <TableCell>#</TableCell>
              <TableCell>Landing</TableCell>
              <TableCell>URL / Path</TableCell>
              <TableCell align="right">Leads</TableCell>
              <TableCell align="right">% Conversión</TableCell>
              <TableCell>Actualizado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={24}/></TableCell></TableRow>}
            {!loading && rows.map((r, i)=>(
              <TableRow key={r.id} hover>
                <TableCell>{page * rowsPerPage + i + 1}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <WebAssetOutlinedIcon fontSize="small"/><Typography fontWeight={700}>{r.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{r.path}</TableCell>
                <TableCell align="right">{r.leads}</TableCell>
                <TableCell align="right">{(r.convRate*100).toFixed(1)}%</TableCell>
                <TableCell>{r.updatedAt ? new Date(r.updatedAt).toLocaleString("es-PE") : "—"}</TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: "text.secondary" }}>No hay landings registradas</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination component="div" rowsPerPageOptions={[10,20,50]} count={rows.length}
          rowsPerPage={rowsPerPage} page={page}
          onPageChange={(_,p)=>setPage(p)} onRowsPerPageChange={(e)=>{setRowsPerPage(parseInt(e.target.value,10)); setPage(0);}}
          labelRowsPerPage="Filas:" />
      </TableContainer>
    </AppLayout>
  );
}
