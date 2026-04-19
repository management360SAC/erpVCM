import { Box, Breadcrumbs, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
  title: string;
  breadcrumb?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, breadcrumb, actions }: Props) {
  return (
    <Paper
      elevation={0}
      sx={{ p: 2.5, mb: 2, borderRadius: 3, border: "1px solid #fed7aa", background: "#fff7ed" }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={800}>{title}</Typography>
          {breadcrumb && (
            <Breadcrumbs sx={{ mt: 0.5 }}>
              <Typography color="text.secondary">Reportes & Analítica</Typography>
              <Typography color="text.primary">{breadcrumb}</Typography>
            </Breadcrumbs>
          )}
        </Box>
        {actions && <Box>{actions}</Box>}
      </Stack>
    </Paper>
  );
}
