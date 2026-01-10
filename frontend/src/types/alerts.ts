export type RepeatEvery = 'NONE'|'DAILY'|'WEEKLY'|'MONTHLY';
export type Channel = 'INAPP'|'EMAIL'|'WHATSAPP';
export type EntityType = 'LEAD'|'CLIENT'|'SERVICE'|'USER'|'OTHER';

export interface Reminder {
  id: number; orgId: number; title: string; description?: string;
  dueAt: string; repeatEvery: RepeatEvery; channel: Channel;
  entityType: EntityType; entityId?: number | null;
  isActive: boolean; lastRunAt?: string|null; nextRunAt?: string|null;
  createdBy: number; createdAt: string; updatedAt: string;
}

export interface AlertItem {
  id: number; title: string; message?: string;
  createdAt: string; readAt?: string|null;
}
