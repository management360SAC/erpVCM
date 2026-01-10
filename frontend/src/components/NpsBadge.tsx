// src/components/NpsBadge.tsx
import { Chip } from "@mui/material";

type NpsLabel =
  | "Promoter" | "Passive" | "Detractor"
  | "Promotor" | "Pasivo"  | "Detractor"  // español también

export default function NpsBadge({ label }: { label: NpsLabel }) {
  const norm = (label || "").toLowerCase();

  const isPromoter = norm === "promoter" || norm === "promotor";
  const isPassive  = norm === "passive"  || norm === "pasivo";
  const isDetractor = norm === "detractor";

  const color = isPromoter ? "success" : isPassive ? "default" : "error";
  const text  = isPromoter ? "Promotor" : isPassive ? "Pasivo" : "Detractor";

  return <Chip size="small" color={color as any} label={text} />;
}
