import { Box, TextField, InputAdornment, Button } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

interface Props {
  from: string;
  to: string;
  q: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onQ: (v: string) => void;
  onExport?: () => void;
  showSearch?: boolean;
  showDates?: boolean;
  exportLabel?: string;
}

export default function FiltrosBar({
  from, to, q,
  onFrom, onTo, onQ,
  onExport,
  showSearch = true,
  showDates  = true,
  exportLabel = "Exportar CSV",
}: Props) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        alignItems: "center",
        mb: 2,
        p: 1.5,
        bgcolor: "#fafbfc",
        border: "1px solid #eef2f7",
        borderRadius: 2,
      }}
    >
      {showDates && (
        <>
          <TextField
            label="Desde"
            type="date"
            size="small"
            value={from}
            onChange={(e) => onFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="Hasta"
            type="date"
            size="small"
            value={to}
            onChange={(e) => onTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />
        </>
      )}

      {showSearch && (
        <TextField
          label="Buscar"
          size="small"
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="Nombre, N° de doc…"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 220, flex: 1 }}
        />
      )}

      <Box sx={{ ml: "auto" }}>
        {onExport && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={onExport}
            sx={{ borderColor: "#f57c00", color: "#f57c00", "&:hover": { bgcolor: "#fff7ed" } }}
          >
            {exportLabel}
          </Button>
        )}
      </Box>
    </Box>
  );
}
