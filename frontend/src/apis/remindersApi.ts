// src/apis/remindersApi.ts
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Types
export type RepeatEvery = "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
export type Channel = "INAPP" | "EMAIL" | "WHATSAPP";
export type EntityType = "LEAD" | "CLIENT" | "SERVICE" | "USER" | "OTHER";

export interface Reminder {
  id: number;
  title: string;
  description?: string;
  dueAt: string;
  nextRunAt?: string;
  repeatEvery: RepeatEvery;
  channel: Channel;
  entityType: EntityType;
  entityId?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListRemindersParams {
  onlyActive?: boolean;
  page?: number;
  size?: number;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
}

// OJO: como baseURL ya tiene /api, aquí NO repetimos /api
export const listReminders = (
  params: ListRemindersParams = {}
): Promise<Page<Reminder>> =>
  api.get("/alerts-reminders/reminders", { params }).then((r) => r.data);

export const createReminder = (
  payload: Partial<Reminder>
): Promise<Reminder> =>
  api.post("/alerts-reminders/reminders", payload).then((r) => r.data);

export const updateReminder = (
  id: number,
  payload: Partial<Reminder>
): Promise<Reminder> =>
  api.put(`/alerts-reminders/reminders/${id}`, payload).then((r) => r.data);

export const toggleReminder = (
  id: number,
  isActive: boolean
): Promise<Reminder> =>
  api
    .patch(`/alerts-reminders/reminders/${id}/toggle`, { isActive })
    .then((r) => r.data);

export const deleteReminder = (id: number): Promise<void> =>
  api.delete(`/alerts-reminders/reminders/${id}`).then((r) => r.data);

export const triggerReminder = (id: number): Promise<void> =>
  api.post(`/alerts-reminders/reminders/${id}/trigger`).then((r) => r.data);