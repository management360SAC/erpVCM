// src/components/ContractedServiceChips.tsx
import { Chip, Stack } from '@mui/material';
import type { ServiceStatus, BillingStatus, CollectionStatus } from '../types/contractedServices';

export function ExecChip({ value }: { value: ServiceStatus }) {
  const map: Record<ServiceStatus, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' }> = {
    PENDIENTE: { label: 'Pendiente', color: 'warning' },
    EN_EJECUCION: { label: 'En ejecución', color: 'primary' },
    COMPLETADO: { label: 'Completado', color: 'success' },
    CANCELADO: { label: 'Cancelado', color: 'error' },
  };
  const m = map[value];
  return <Chip label={m.label} color={m.color} size="small" />;
}

export function BillingChip({ value }: { value: BillingStatus }) {
  const map: Record<BillingStatus, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' }> = {
    NO_FACTURADO: { label: 'No facturado', color: 'default' },
    FACTURADO_PARCIAL: { label: 'Fact. parcial', color: 'warning' },
    FACTURADO_TOTAL: { label: 'Fact. total', color: 'success' },
  };
  const m = map[value];
  return <Chip label={m.label} color={m.color} size="small" variant={m.color === 'default' ? 'outlined' : 'filled'} />;
}

export function CollectionChip({ value }: { value: CollectionStatus }) {
  const map: Record<CollectionStatus, { label: string; color: 'default' | 'primary' | 'success' | 'warning' | 'error' }> = {
    PENDIENTE_COBRO: { label: 'Pend. cobro', color: 'default' },
    COBRO_PARCIAL: { label: 'Cobro parcial', color: 'warning' },
    COBRADO: { label: 'Cobrado', color: 'success' },
  };
  const m = map[value];
  return <Chip label={m.label} color={m.color} size="small" variant={m.color === 'default' ? 'outlined' : 'filled'} />;
}

export function StatusStack(props: {
  execution: ServiceStatus;
  billing: BillingStatus;
  collection: CollectionStatus;
}) {
  return (
    <Stack direction="row" spacing={1}>
      <ExecChip value={props.execution} />
      <BillingChip value={props.billing} />
      <CollectionChip value={props.collection} />
    </Stack>
  );
}
