// src/pages/pipeline/EmbudoVentas.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AppLayout from "../../layout/AppLayout";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import CotizacionRapidaModal from "./CotizacionRapidaModal";
import NuevaOportunidadModal from "./NuevaOportunidadModal";

const PAGE_SIZE = 10;

// ======= Etapas del embudo (ajusta si tu dominio usa otras) =======
export type Stage =
  | "PROSPECTO"
  | "CONTACTO"
  | "CALIFICADO"
  | "PROPUESTA"
  | "CERRADO_GANADO"
  | "CERRADO_PERDIDO";

const STAGES: { key: Stage; title: string; color: "default" | "primary" | "success" | "warning" | "info" | "error" }[] =
  [
    { key: "PROSPECTO",        title: "Prospecto",       color: "default" },
    { key: "CONTACTO",         title: "Contacto",        color: "info"    },
    { key: "CALIFICADO",       title: "Calificado",      color: "warning" },
    { key: "PROPUESTA",        title: "Propuesta",       color: "primary" },
    { key: "CERRADO_GANADO",   title: "Cerrado (Ganado)",color: "success" },
    { key: "CERRADO_PERDIDO",  title: "Cerrado (Perdido)",color: "error"  },
  ];

// ======= API helpers (ajusta endpoints según tu backend) =======
type Deal = {
  id: number;
  title: string;           // nombre de la oportunidad
  clientId?: number|null;
  clientName?: string|null;
  amount?: number|null;    // valor PEN
  ownerName?: string|null; // responsable
  stage: Stage;
  createdAt?: string|null;
  probability?: number|null; // 0-100
};

type BoardResp = {
  // opcional: el backend puede enviarte un mapa por etapa
  deals: Deal[];
};

const PEN = (v?: number|null) =>
  `S/ ${Number(v || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

async function fetchBoard(): Promise<BoardResp> {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/deals/board`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function updateDealStage(id: number, stage: Stage) {
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  const res = await fetch(`/api/deals/${id}/stage`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stage }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ======= Card de oportunidad =======
function DealCard({ deal, onOpen, onQuote }: { deal: Deal; onOpen: (d: Deal) => void; onQuote: (d: Deal) => void }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: "1px solid #e9eef5",
        mb: 1,
        background: "#fff",
        cursor: "grab",
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", String(deal.id));
      }}
    >
      <Stack spacing={0.75}>
        <Typography fontWeight={700} fontSize={14} lineHeight={1.2}>
          {deal.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {deal.clientName || "—"} · {deal.ownerName || "Sin asignar"}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Chip
            size="small"
            icon={<MonetizationOnOutlinedIcon fontSize="small" />}
            label={PEN(deal.amount)}
            variant="outlined"
          />
          {typeof deal.probability === "number" && (
            <Typography variant="caption" color="text.secondary">
              {Math.round(deal.probability)}%
            </Typography>
          )}
        </Stack>
        <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
          <Tooltip title="Cotización rápida (no se guarda en el historial)">
            <IconButton size="small" onClick={() => onQuote(deal)}>
              <RequestQuoteOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Abrir oportunidad">
            <IconButton size="small" onClick={() => onOpen(deal)}>
              <LaunchOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
}

// ======= Sección de etapa (acordeón) =======
function StageAccordion({
  title,
  color,
  stageKey,
  items,
  onDropDeal,
  onQuote,
  onOpen,
  totalAmount,
  expanded,
  onToggle,
}: {
  title: string;
  color: "default" | "primary" | "success" | "warning" | "info" | "error";
  stageKey: Stage;
  items: Deal[];
  onDropDeal: (dealId: number, toStage: Stage) => void;
  onQuote: (d: Deal) => void;
  onOpen: (d: Deal) => void;
  totalAmount: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = items.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [items.length]);

  return (
    <Accordion
      expanded={expanded}
      onChange={onToggle}
      disableGutters
      elevation={0}
      sx={{
        border: "1px solid #e9eef5",
        borderRadius: "12px !important",
        "&:before": { display: "none" },
        overflow: "hidden",
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const id = Number(e.dataTransfer.getData("text/plain"));
        if (!isNaN(id)) onDropDeal(id, stageKey);
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ background: "#f8fbff" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ width: "100%", pr: 1 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" color={color} label={title} />
            <Typography variant="caption" color="text.secondary">
              {items.length} {items.length === 1 ? "oportunidad" : "oportunidades"}
            </Typography>
          </Stack>
          <Typography variant="body2" fontWeight={700}>
            {PEN(totalAmount)}
          </Typography>
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ background: "#fbfdff", minHeight: 72 }}>
        {pageItems.map((d) => (
          <DealCard key={d.id} deal={d} onOpen={onOpen} onQuote={onQuote} />
        ))}

        {items.length === 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: "1px dashed #dbe3ef",
              color: "text.secondary",
              textAlign: "center",
              fontSize: 13,
              background: "#fff",
            }}
          >
            Arrastra oportunidades aquí
          </Paper>
        )}

        {totalPages > 1 && (
          <Stack alignItems="center" sx={{ mt: 1.5 }}>
            <Pagination
              size="small"
              count={totalPages}
              page={safePage + 1}
              onChange={(_, p) => setPage(p - 1)}
            />
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

// ======= Página principal =======
export default function EmbudoVentas() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [quoteDeal, setQuoteDeal] = useState<Deal | null>(null);
  const [newDealOpen, setNewDealOpen] = useState(false);
  const [viewDeal, setViewDeal] = useState<Deal | null>(null);
  const [changingStage, setChangingStage] = useState(false);
  const [expandedStages, setExpandedStages] = useState<Set<Stage>>(
    () => new Set(STAGES.map((s) => s.key))
  );

  const toggleStage = (key: Stage) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  async function load() {
    try {
      setLoading(true);
      setErrorMsg("");
      const data = await fetchBoard();
      setDeals(data.deals || []);
    } catch (e: any) {
      setErrorMsg(e?.message || "No se pudo cargar el embudo");
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = "Embudo de Ventas";
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) return;
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!debouncedQ.trim()) return deals;
    const ql = debouncedQ.toLowerCase();
    return deals.filter((d) =>
      (d.title || "").toLowerCase().includes(ql) ||
      (d.clientName || "").toLowerCase().includes(ql) ||
      (d.ownerName || "").toLowerCase().includes(ql)
    );
  }, [deals, debouncedQ]);

  const grouped = useMemo(() => {
    const map: Record<Stage, Deal[]> = {
      PROSPECTO: [], CONTACTO: [], CALIFICADO: [],
      PROPUESTA: [], CERRADO_GANADO: [], CERRADO_PERDIDO: [],
    };
    for (const d of filtered) map[d.stage]?.push(d);
    return map;
  }, [filtered]);

  const totals = useMemo(() => {
    const tot: Record<Stage, number> = {
      PROSPECTO: 0, CONTACTO: 0, CALIFICADO: 0,
      PROPUESTA: 0, CERRADO_GANADO: 0, CERRADO_PERDIDO: 0,
    };
    for (const d of filtered) tot[d.stage] += Number(d.amount || 0);
    return tot;
  }, [filtered]);

  async function handleDrop(dealId: number, toStage: Stage) {
    setDeals((prev) =>
      prev.map((d) => (d.id === dealId ? { ...d, stage: toStage } : d))
    ); // optimista

    try {
      await updateDealStage(dealId, toStage);
    } catch (e) {
      // revertir si falla
      setDeals((prev) => {
        // carga original
        const original = deals.find((x) => x.id === dealId);
        return prev.map((d) => (d.id === dealId ? { ...d, stage: original?.stage || d.stage } : d));
      });
      alert("No se pudo actualizar la etapa.");
    }
  }

  return (
    <AppLayout title="Embudo de Ventas">
      {/* Encabezado */}
      <Paper
        elevation={0}
        sx={{ p: { xs: 2, sm: 2.5 }, mb: 2, borderRadius: 3, border: "1px solid #eef2f7", background: "#eef6ff" }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
              Embudo de Ventas
            </Typography>
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Gestión</Typography>
              <Typography color="text.primary">Pipeline</Typography>
            </Breadcrumbs>
          </Box>
          <Avatar
            src="/marca-secundaria.png"
            sx={{ width: { xs: 48, sm: 72 }, height: { xs: 48, sm: 72 }, flexShrink: 0 }}
          />
        </Stack>
      </Paper>

      {/* Filtros / acciones */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mb: 1.5 }}
      >
        <TextField
          size="small"
          placeholder="Buscar por oportunidad, cliente o responsable"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          sx={{ width: { xs: "100%", sm: 420 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />

        <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />

        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ rowGap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load} disabled={loading} sx={{ flex: { xs: 1, sm: "0 0 auto" } }}>
            {loading ? "Actualizando..." : "Actualizar"}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setNewDealOpen(true)} sx={{ flex: { xs: 1, sm: "0 0 auto" } }}>
            Nueva Oportunidad
          </Button>
        </Stack>
      </Stack>

      {/* Errores */}
      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

      {/* Board (acordeón vertical, una etapa debajo de la otra) */}
      {loading ? (
        <Paper elevation={0} sx={{ border: "1px solid #eef2f7", borderRadius: 3, p: 6, textAlign: "center" }}>
          <CircularProgress size={28} />
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          <Paper
            elevation={0}
            sx={{ p: 1.5, borderRadius: 3, border: "1px solid #eef2f7", background: "#fbfdff" }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 0.5, sm: 2 }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Typography variant="body2" color="text.secondary">
                Arrastra tarjetas entre etapas (o usa "Cambiar etapa" desde el detalle) para actualizar su estado.
              </Typography>
              <Typography variant="body2">
                Ganado: <b>{PEN(totals.CERRADO_GANADO)}</b>
              </Typography>
            </Stack>
          </Paper>

          {STAGES.map((s) => (
            <StageAccordion
              key={s.key}
              title={s.title}
              color={s.color}
              stageKey={s.key}
              items={grouped[s.key] || []}
              totalAmount={totals[s.key] || 0}
              onDropDeal={handleDrop}
              onQuote={setQuoteDeal}
              onOpen={setViewDeal}
              expanded={expandedStages.has(s.key)}
              onToggle={() => toggleStage(s.key)}
            />
          ))}
        </Stack>
      )}

      {quoteDeal && (
        <CotizacionRapidaModal
          open={!!quoteDeal}
          onClose={() => setQuoteDeal(null)}
          dealId={quoteDeal.id}
          dealTitle={quoteDeal.title}
          clientId={quoteDeal.clientId}
          clientName={quoteDeal.clientName || undefined}
          onSent={load}
        />
      )}

      <NuevaOportunidadModal
        open={newDealOpen}
        onClose={() => setNewDealOpen(false)}
        onCreated={load}
      />

      <Dialog open={!!viewDeal} onClose={() => setViewDeal(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>{viewDeal?.title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Cliente</Typography>
              <Typography fontWeight={600}>{viewDeal?.clientName || "—"}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Responsable</Typography>
              <Typography fontWeight={600}>{viewDeal?.ownerName || "Sin asignar"}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Monto</Typography>
              <Typography fontWeight={600}>{PEN(viewDeal?.amount)}</Typography>
            </Stack>
            <TextField
              select
              size="small"
              label="Etapa"
              value={viewDeal?.stage || ""}
              disabled={changingStage}
              onChange={async (e) => {
                const toStage = e.target.value as Stage;
                if (!viewDeal || toStage === viewDeal.stage) return;
                setChangingStage(true);
                await handleDrop(viewDeal.id, toStage);
                setChangingStage(false);
                setViewDeal((d) => (d ? { ...d, stage: toStage } : d));
              }}
              fullWidth
            >
              {STAGES.map((s) => (
                <MenuItem key={s.key} value={s.key}>{s.title}</MenuItem>
              ))}
            </TextField>
            <Stack direction="row" justifyContent="space-between">
              <Typography color="text.secondary">Creado</Typography>
              <Typography fontWeight={600}>
                {viewDeal?.createdAt ? new Date(viewDeal.createdAt).toLocaleDateString("es-PE") : "—"}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDeal(null)}>Cerrar</Button>
          <Button
            variant="contained"
            startIcon={<RequestQuoteOutlinedIcon />}
            onClick={() => {
              if (viewDeal) setQuoteDeal(viewDeal);
              setViewDeal(null);
            }}
          >
            Cotizar
          </Button>
        </DialogActions>
      </Dialog>
    </AppLayout>
  );
}
