// src/pages/reportes/KPIsTableros.tsx
import { useEffect, useState } from "react";
import {
  Alert, Avatar, Box, Breadcrumbs, Card, CardContent, Chip, CircularProgress,
  Grid, Paper, Stack, Typography
} from "@mui/material";
import AppLayout from "../../layout/AppLayout";
import { LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

type KpiSummary = {
  totalLeads: number;
  convRate: number;          // 0..1
  pipelineValue: number;     // PEN
  mrr: number;               // PEN
  churnRate: number;         // 0..1
};

type SeriesPoint = { x: string; value: number; aux?: number };

type KpisResp = {
  summary: KpiSummary;
  leadsSeries: SeriesPoint[];      // por mes
  revenueSeries: SeriesPoint[];    // por mes
};

const PEN = (v: number) =>
  `S/ ${Number(v || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PCT = (v: number) => `${(Number(v || 0) * 100).toFixed(1)}%`;
const msg = async (r: Response) => { try { const j=await r.json(); return j?.message || r.statusText; } catch { return r.statusText; } };

async function fetchKpis(): Promise<KpisResp> {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const r = await fetch(`/api/analytics/kpis`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(await msg(r));
  return r.json();
}

export default function KPIsTableros() {
  const [data, setData] = useState<KpisResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function load() {
    try {
      setLoading(true);
      setErrorMsg("");
      const d = await fetchKpis();
      setData(d);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudieron cargar los KPIs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "KPIs y Tableros";
    if (!localStorage.getItem("accessToken") && !localStorage.getItem("token")) return;
    load();
  }, []);

  const s = data?.summary;

  return (
    <AppLayout title="KPIs y Tableros">
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #eef2f7", background: "#eef6ff" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>KPIs y Tableros</Typography>
            <Breadcrumbs sx={{ mt: .5 }}>
              <Typography color="text.secondary">Reportes & Analítica</Typography>
              <Typography color="text.primary">KPIs</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
      {loading && (
        <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress/></Box>
      )}

      {!loading && (
        <>
          {/* Tarjetas KPI */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Leads (últ. 30 días)</Typography>
                  <Typography variant="h5" fontWeight={800}>{s?.totalLeads ?? "—"}</Typography>
                  <Chip size="small" label="Actividad" sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Tasa de Conversión</Typography>
                  <Typography variant="h5" fontWeight={800}>{s ? PCT(s.convRate) : "—"}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Valor del Pipeline</Typography>
                  <Typography variant="h5" fontWeight={800}>{s ? PEN(s.pipelineValue) : "—"}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={3}>
              <Card elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3 }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">MRR / Churn</Typography>
                  <Typography variant="h5" fontWeight={800}>{s ? PEN(s.mrr) : "—"}</Typography>
                  <Typography variant="caption" color="text.secondary">{s ? `Churn ${PCT(s.churnRate)}` : "—"}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Gráficos */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3 }}>
                <Typography fontWeight={700} sx={{ mb: 1 }}>Leads por mes</Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data?.leadsSeries || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Leads" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3 }}>
                <Typography fontWeight={700} sx={{ mb: 1 }}>Ingresos por mes</Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={data?.revenueSeries || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="x" />
                    <YAxis />
                    <Tooltip formatter={(v)=>PEN(Number(v))} />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Ingresos" />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </AppLayout>
  );
}
