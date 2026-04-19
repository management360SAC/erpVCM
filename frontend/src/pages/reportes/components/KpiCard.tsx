import { Card, CardContent, Typography, Box, Skeleton } from "@mui/material";
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  color?: string;   // borde izquierdo
  loading?: boolean;
}

export default function KpiCard({ label, value, sub, icon, color = "#f57c00", loading }: Props) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #eef2f7",
        borderLeft: `4px solid ${color}`,
        borderRadius: 3,
        height: "100%",
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              {label}
            </Typography>
            {loading ? (
              <Skeleton width={100} height={36} />
            ) : (
              <Typography variant="h5" fontWeight={800}>
                {value}
              </Typography>
            )}
            {sub && (
              <Typography variant="caption" color="text.secondary">
                {sub}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ color, opacity: 0.8, mt: 0.5 }}>
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
