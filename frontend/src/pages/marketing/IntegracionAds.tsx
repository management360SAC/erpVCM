import { useEffect, useState } from "react";
import { Alert, Avatar, Box, Breadcrumbs, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import AppLayout from "../../layout/AppLayout";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

type Conn = { id: string; channel: "Google Ads" | "Facebook Ads" | "Instagram" | "TikTok"; status: "CONECTADO" | "DESCONECTADO"; lastSync?: string|null };

export default function IntegracionAds() {
  const [rows, setRows] = useState<Conn[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function load() {
    try {
      setLoading(true); setErrorMsg("");
      // TODO: GET /api/marketing/integrations
      setRows([
        // demo
        // { id: "gads", channel: "Google Ads", status: "DESCONECTADO" },
      ]);
    } catch (e:any) { setErrorMsg(e?.message || "No se pudieron cargar integraciones"); }
    finally { setLoading(false); }
  }
  useEffect(() => { document.title = "Integración Ads/Redes"; load(); }, []);

  return (
    <AppLayout title="Integración Ads/Redes">
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #eef2f7", background: "#eef6ff" }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h5" fontWeight={800}>Integración Ads/Redes</Typography>
            <Breadcrumbs sx={{ mt: .5 }}>
              <Typography color="text.secondary">Marketing & Escalabilidad</Typography>
              <Typography color="text.primary">Integraciones</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar src="/marca-secundaria.png" sx={{ width: 72, height: 72 }} />
        </Stack>
      </Paper>

      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

      <Paper elevation={0} sx={{ p: 2, border: "1px solid #eef2f7", borderRadius: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
          <Button variant="outlined" startIcon={<RefreshIcon/>} onClick={load} disabled={loading}>
            {loading ? "Actualizando..." : "Actualizar"}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" startIcon={<CampaignOutlinedIcon/>} onClick={()=>alert("Conectar nueva cuenta")}>
            Conectar cuenta
          </Button>
        </Stack>

        {loading ? (
          <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress/></Box>
        ) : (
          <Stack spacing={1}>
            {rows.map(r => (
              <Paper key={r.id} elevation={0} sx={{ p: 1.5, border: "1px solid #eef2f7", borderRadius: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CampaignOutlinedIcon fontSize="small" />
                    <Typography fontWeight={700}>{r.channel}</Typography>
                    <Chip size="small" label={r.status} color={r.status==="CONECTADO" ? "success" : "default"} variant="outlined" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Última sincronización: {r.lastSync ? new Date(r.lastSync).toLocaleString("es-PE") : "—"}
                  </Typography>
                </Stack>
              </Paper>
            ))}
            {rows.length === 0 && <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>No hay integraciones conectadas</Box>}
          </Stack>
        )}
      </Paper>
    </AppLayout>
  );
}
