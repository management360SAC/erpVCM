// src/pages/marketing/LeadSourcesDashboard.tsx
import { useEffect, useState, useMemo } from "react";
import {
  Box, Grid, Paper, Typography, CircularProgress, Select, MenuItem,
  FormControl, InputLabel, Alert, Card, CardContent, Stack, Chip
} from "@mui/material";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, PieChart, Pie
} from "recharts";
import { 
  TrendingUp, Assessment, Source, Description 
} from "@mui/icons-material";
import dayjs from "dayjs";
import AppLayout from "../../layout/AppLayout";
import { http } from "../../apis/http";

type LeadStats = {
  bySource: Array<{ source: string; total: number }>;
  byForm: Array<{ form_name: string; total: number }>;
  from: string;
  to: string;
};

const COLORS = [
  "#2196f3", "#4caf50", "#ff9800", "#f44336", 
  "#9c27b0", "#00bcd4", "#ffeb3b", "#795548"
];

export default function LeadSourcesDashboard() {
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [range, setRange] = useState<"7" | "30" | "90">("30");

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const to = dayjs().format("YYYY-MM-DD");
      const from = dayjs().subtract(parseInt(range, 10), "day").format("YYYY-MM-DD");
      const res = await http.get(`/leads/stats`, { params: { from, to } });
      setStats(res.data as LeadStats);
    } catch (e: any) {
      if (e?.response?.status === 403) {
        setErr("No tienes permisos para ver estas estadísticas.");
      } else {
        setErr(e?.response?.data?.message || e?.message || "Error al cargar estadísticas.");
      }
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const totalLeads = useMemo(() => {
    if (!stats?.bySource) return 0;
    return stats.bySource.reduce((sum, item) => sum + item.total, 0);
  }, [stats]);

  const topSource = useMemo(() => {
    if (!stats?.bySource || stats.bySource.length === 0) return null;
    return stats.bySource.reduce((prev, current) => 
      current.total > prev.total ? current : prev
    );
  }, [stats]);

  const topForm = useMemo(() => {
    if (!stats?.byForm || stats.byForm.length === 0) return null;
    return stats.byForm.reduce((prev, current) => 
      current.total > prev.total ? current : prev
    );
  }, [stats]);

  const dateRange = useMemo(() => {
    if (!stats?.from || !stats?.to) return "Selecciona un rango";
    return `${dayjs(stats.from).format("DD/MM/YYYY")} - ${dayjs(stats.to).format("DD/MM/YYYY")}`;
  }, [stats]);

  return (
    <AppLayout title="Estadísticas de Fuentes de Leads">
      {/* Header con filtros */}
      <Box sx={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        mb: 3,
        flexWrap: "wrap",
        gap: 2
      }}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Análisis de Leads
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {dateRange}
          </Typography>
        </Box>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Período</InputLabel>
          <Select
            value={range}
            label="Período"
            onChange={(e) => setRange(e.target.value as any)}
          >
            <MenuItem value="7">📅 Últimos 7 días</MenuItem>
            <MenuItem value="30">📅 Últimos 30 días</MenuItem>
            <MenuItem value="90">📅 Últimos 90 días</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Mensaje de error */}
      {err && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {err}
        </Alert>
      )}

      {/* Contenido principal */}
      {loading ? (
        <Box sx={{ 
          display: "flex", 
          flexDirection: "column",
          alignItems: "center", 
          justifyContent: "center",
          py: 10 
        }}>
          <CircularProgress size={60} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Cargando estadísticas...
          </Typography>
        </Box>
      ) : stats ? (
        <>
          {/* Cards de resumen */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={0} sx={{ 
                border: "1px solid #e3f2fd", 
                borderRadius: 3,
                background: "linear-gradient(135deg, #e3f2fd 0%, #ffffff 100%)"
              }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                      bgcolor: "#2196f3", 
                      borderRadius: 2, 
                      p: 1.5,
                      display: "flex"
                    }}>
                      <TrendingUp sx={{ color: "white", fontSize: 32 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total de Leads
                      </Typography>
                      <Typography variant="h4" fontWeight={700}>
                        {totalLeads}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={0} sx={{ 
                border: "1px solid #e8f5e9", 
                borderRadius: 3,
                background: "linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)"
              }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                      bgcolor: "#4caf50", 
                      borderRadius: 2, 
                      p: 1.5,
                      display: "flex"
                    }}>
                      <Source sx={{ color: "white", fontSize: 32 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Mejor Fuente
                      </Typography>
                      <Typography variant="h6" fontWeight={700} noWrap>
                        {topSource?.source || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {topSource?.total || 0} leads
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card elevation={0} sx={{ 
                border: "1px solid #fff3e0", 
                borderRadius: 3,
                background: "linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)"
              }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                      bgcolor: "#ff9800", 
                      borderRadius: 2, 
                      p: 1.5,
                      display: "flex"
                    }}>
                      <Description sx={{ color: "white", fontSize: 32 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Mejor Formulario
                      </Typography>
                      <Typography variant="h6" fontWeight={700} noWrap>
                        {topForm?.form_name || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {topForm?.total || 0} leads
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Gráficos */}
          <Grid container spacing={3}>
            {/* Gráfico de barras - Por Fuente */}
            <Grid item xs={12} lg={6}>
              <Paper elevation={0} sx={{ 
                p: 3, 
                border: "1px solid #eef2f7", 
                borderRadius: 3,
                height: "100%"
              }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <Assessment sx={{ color: "#2196f3" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Leads por Fuente
                  </Typography>
                </Stack>

                {stats.bySource && stats.bySource.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={stats.bySource} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="source" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: 8, 
                          border: "1px solid #e0e0e0",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }}
                      />
                      <Bar dataKey="total" name="Leads" radius={[8, 8, 0, 0]}>
                        {stats.bySource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    height: 350,
                    color: "text.secondary"
                  }}>
                    <Typography>No hay datos disponibles</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Gráfico de barras - Por Formulario */}
            <Grid item xs={12} lg={6}>
              <Paper elevation={0} sx={{ 
                p: 3, 
                border: "1px solid #eef2f7", 
                borderRadius: 3,
                height: "100%"
              }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                  <Assessment sx={{ color: "#4caf50" }} />
                  <Typography variant="h6" fontWeight={700}>
                    Leads por Formulario
                  </Typography>
                </Stack>

                {stats.byForm && stats.byForm.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={stats.byForm} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="form_name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: 8, 
                          border: "1px solid #e0e0e0",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                        }}
                      />
                      <Bar dataKey="total" name="Leads" radius={[8, 8, 0, 0]}>
                        {stats.byForm.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center",
                    height: 350,
                    color: "text.secondary"
                  }}>
                    <Typography>No hay datos disponibles</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Lista detallada de fuentes */}
            {stats.bySource && stats.bySource.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ 
                  p: 3, 
                  border: "1px solid #eef2f7", 
                  borderRadius: 3 
                }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Detalle por Fuente
                  </Typography>
                  <Stack spacing={2}>
                    {stats.bySource
                      .sort((a, b) => b.total - a.total)
                      .map((item, index) => (
                        <Box 
                          key={index}
                          sx={{ 
                            display: "flex", 
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            bgcolor: "#f8f9fa",
                            borderRadius: 2,
                            border: "1px solid #e9ecef"
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Box sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: "50%",
                              bgcolor: COLORS[index % COLORS.length]
                            }} />
                            <Typography fontWeight={500}>{item.source}</Typography>
                          </Stack>
                          <Chip 
                            label={item.total} 
                            size="small"
                            sx={{ 
                              fontWeight: 700,
                              bgcolor: COLORS[index % COLORS.length],
                              color: "white"
                            }}
                          />
                        </Box>
                      ))}
                  </Stack>
                </Paper>
              </Grid>
            )}

            {/* Lista detallada de formularios */}
            {stats.byForm && stats.byForm.length > 0 && (
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ 
                  p: 3, 
                  border: "1px solid #eef2f7", 
                  borderRadius: 3 
                }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                    Detalle por Formulario
                  </Typography>
                  <Stack spacing={2}>
                    {stats.byForm
                      .sort((a, b) => b.total - a.total)
                      .map((item, index) => (
                        <Box 
                          key={index}
                          sx={{ 
                            display: "flex", 
                            alignItems: "center",
                            justifyContent: "space-between",
                            p: 2,
                            bgcolor: "#f8f9fa",
                            borderRadius: 2,
                            border: "1px solid #e9ecef"
                          }}
                        >
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Box sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: "50%",
                              bgcolor: COLORS[(index + 2) % COLORS.length]
                            }} />
                            <Typography fontWeight={500}>{item.form_name}</Typography>
                          </Stack>
                          <Chip 
                            label={item.total} 
                            size="small"
                            sx={{ 
                              fontWeight: 700,
                              bgcolor: COLORS[(index + 2) % COLORS.length],
                              color: "white"
                            }}
                          />
                        </Box>
                      ))}
                  </Stack>
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      ) : (
        !err && (
          <Paper 
            elevation={0} 
            sx={{ 
              p: 6, 
              textAlign: "center",
              border: "1px solid #eef2f7",
              borderRadius: 3
            }}
          >
            <Assessment sx={{ fontSize: 80, color: "#bdbdbd", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Sin datos disponibles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No hay información para mostrar en el período seleccionado
            </Typography>
          </Paper>
        )
      )}
    </AppLayout>
  );
}