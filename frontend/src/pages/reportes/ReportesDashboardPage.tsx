import { useEffect, useState } from "react";
import {
  Alert, Box, CircularProgress, Grid, Paper, Typography,
} from "@mui/material";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";

import AppLayout from "../../layout/AppLayout";
import KpiCard from "./components/KpiCard";
import FiltrosBar from "./components/FiltrosBar";
import PageHeader from "./components/PageHeader";
import { getDashboard, type DashboardKpis } from "../../apis/reportes";

const PEN = (v: number) =>
  `S/ ${Number(v || 0).toLocaleString("es-PE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const today   = () => new Date().toISOString().slice(0, 10);
const firstOfMonth = () => {
  const d = new Date(); d.setDate(1);
  return d.toISOString().slice(0, 10);
};

const COLORS = ["#f57c00","#fb8c00","#ffa726","#ffb74d","#ffcc80","#ffe0b2","#1565c0","#42a5f5"];

export default function ReportesDashboardPage() {
  const [data, setData]     = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [from, setFrom]     = useState(firstOfMonth());
  const [to, setTo]         = useState(today());
  const [q, setQ]           = useState("");

  async function load() {
    try {
      setLoading(true); setError("");
      setData(await getDashboard({ from, to }));
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Error al cargar dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { document.title = "Dashboard Analítica | VCM"; }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [from, to]);

  const kpi = data;

  return (
    <AppLayout>
      <PageHeader title="Dashboard Analítica" breadcrumb="Dashboard" />

      <FiltrosBar
        from={from} to={to} q={q}
        onFrom={setFrom} onTo={setTo} onQ={setQ}
        showSearch={false}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#f57c00" }} />
        </Box>
      )}

      {!loading && (
        <>
          {/* ── KPI Cards ─────────────────────────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Total Clientes"
                value={kpi?.totalClientes ?? "—"}
                sub={`${kpi?.serviciosActivos ?? 0} servicios activos`}
                icon={<PeopleAltOutlinedIcon fontSize="large" />}
                color="#1565c0"
                loading={!kpi}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Pagos en el período"
                value={kpi ? PEN(kpi.pagosMesTotal) : "—"}
                sub={`${kpi?.pagosMesCount ?? 0} transacciones`}
                icon={<PaymentsOutlinedIcon fontSize="large" />}
                color="#2e7d32"
                loading={!kpi}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Facturas Pendientes"
                value={kpi ? PEN(kpi.facturasPendienteMonto) : "—"}
                sub={`${kpi?.facturasAbiertas ?? 0} facturas abiertas`}
                icon={<ReceiptLongOutlinedIcon fontSize="large" />}
                color="#c62828"
                loading={!kpi}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Pipeline (Deals abiertos)"
                value={kpi ? PEN(kpi.pipelineValue) : "—"}
                sub={`${kpi?.dealsAbiertas ?? 0} oportunidades • ${kpi?.dealsGanadas ?? 0} ganadas`}
                icon={<TrendingUpOutlinedIcon fontSize="large" />}
                color="#f57c00"
                loading={!kpi}
              />
            </Grid>
          </Grid>

          {/* ── KPI extra ─────────────────────────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Leads nuevos en el período"
                value={kpi?.leadsNuevosMes ?? "—"}
                color="#7b1fa2"
                loading={!kpi}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <KpiCard
                label="Servicios Pendientes"
                value={kpi?.serviciosPendientes ?? "—"}
                color="#ef6c00"
                loading={!kpi}
              />
            </Grid>
          </Grid>

          {/* ── Gráficas ──────────────────────────────────────────── */}
          <Grid container spacing={2}>
            {/* Pagos por mes */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3 }}>
                <Typography fontWeight={700} sx={{ mb: 1.5 }}>
                  Pagos por mes (últ. 12 meses)
                </Typography>
                {(kpi?.pagosPorMes?.length ?? 0) === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                    Sin datos en el rango
                  </Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={kpi!.pagosPorMes.map(p => ({ mes: p.label, total: Number(p.value) }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `S/${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => PEN(v)} />
                      <Bar dataKey="total" name="Pagado" fill="#f57c00" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>

            {/* Leads por mes */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3 }}>
                <Typography fontWeight={700} sx={{ mb: 1.5 }}>
                  Leads por mes (últ. 12 meses)
                </Typography>
                {(kpi?.leadsPorMes?.length ?? 0) === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                    Sin datos
                  </Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={kpi!.leadsPorMes.map(p => ({ mes: p.label, leads: Number(p.value) }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="leads" name="Leads" stroke="#1565c0" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>

            {/* Clientes por sector */}
            <Grid item xs={12} md={5}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3 }}>
                <Typography fontWeight={700} sx={{ mb: 1.5 }}>
                  Distribución por sector
                </Typography>
                {(kpi?.clientesPorSector?.length ?? 0) === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                    Sin datos
                  </Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={kpi!.clientesPorSector.map(c => ({ name: c.category, value: c.count }))}
                        dataKey="value"
                        nameKey="name"
                        cx="50%" cy="50%"
                        outerRadius={90}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {kpi!.clientesPorSector.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>

            {/* Resumen numérico */}
            <Grid item xs={12} md={7}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3, height: "100%" }}>
                <Typography fontWeight={700} sx={{ mb: 2 }}>
                  Resumen del período
                </Typography>
                {[
                  ["Clientes totales",         kpi?.totalClientes ?? 0,                         "unidades"],
                  ["Servicios activos",         kpi?.serviciosActivos ?? 0,                      "unidades"],
                  ["Servicios pendientes",      kpi?.serviciosPendientes ?? 0,                   "unidades"],
                  ["Pagado en el período",      kpi ? PEN(kpi.pagosMesTotal) : "—",              ""],
                  ["Facturas por cobrar",       kpi ? PEN(kpi.facturasPendienteMonto) : "—",    ""],
                  ["Valor del pipeline",        kpi ? PEN(kpi.pipelineValue) : "—",              ""],
                  ["Deals ganados (período)",   kpi?.dealsGanadas ?? 0,                          "unidades"],
                  ["Leads nuevos (período)",    kpi?.leadsNuevosMes ?? 0,                        "unidades"],
                ].map(([lbl, val, unit]) => (
                  <Box
                    key={lbl as string}
                    sx={{ display: "flex", justifyContent: "space-between", py: 0.8,
                          borderBottom: "1px solid #f5f5f5" }}
                  >
                    <Typography variant="body2" color="text.secondary">{lbl}</Typography>
                    <Typography variant="body2" fontWeight={700}>
                      {val}{unit ? ` ${unit}` : ""}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>

          {!kpi && !loading && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <AssessmentOutlinedIcon sx={{ fontSize: 64, color: "#e0e0e0" }} />
              <Typography color="text.secondary">Sin datos disponibles</Typography>
            </Box>
          )}
        </>
      )}
    </AppLayout>
  );
}
