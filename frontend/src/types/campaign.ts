// src/types/campaign.ts
export interface Campaign {
  id: number;
  orgId: number;
  name: string;
  status: 'BORRADOR' | 'PROGRAMADA' | 'ENVIANDO' | 'ENVIADA' | 'PAUSADA' | 'CANCELADA';
  sent: number;
  opens: number;
  clicks: number;
  scheduledAt?: string | null;
}