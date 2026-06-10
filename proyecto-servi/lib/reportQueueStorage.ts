import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ReportRouteEstatus } from './reportRouteHelpers';
import { generateUUID } from './uuid';

const STORAGE_KEY = 'servi:report-queue-v1';

export const MAX_REPORT_ATTEMPTS = 3;

export type QueuedReport = {
  id: string;
  bitacoraId: string;
  photoUri: string;
  latitud: number;
  longitud: number;
  precision_m: number | null;
  estatus: ReportRouteEstatus;
  reportIndex: number;
  direccion: string;
  fecha: string;
  hora: string;
  createdAt: number;
  attempts: number;
  lastAttemptAt: number;
  lastError?: string;
};

export type QueueSummary = {
  pending: number;
  failed: number;
  total: number;
};

export async function loadReportQueue(): Promise<QueuedReport[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as QueuedReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveReportQueue(items: QueuedReport[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function enqueueReport(item: Omit<QueuedReport, 'id' | 'createdAt' | 'attempts' | 'lastAttemptAt'>): Promise<QueuedReport> {
  const queue = await loadReportQueue();
  const entry: QueuedReport = {
    ...item,
    id: generateUUID(),
    createdAt: Date.now(),
    attempts: 0,
    lastAttemptAt: 0,
  };
  queue.push(entry);
  await saveReportQueue(queue);
  return entry;
}

export async function updateReportQueueItem(
  id: string,
  patch: Partial<QueuedReport>,
): Promise<QueuedReport | null> {
  const queue = await loadReportQueue();
  const idx = queue.findIndex((q) => q.id === id);
  if (idx < 0) return null;
  queue[idx] = { ...queue[idx], ...patch };
  await saveReportQueue(queue);
  return queue[idx];
}

export async function removeReportQueueItem(id: string): Promise<void> {
  const queue = await loadReportQueue();
  await saveReportQueue(queue.filter((q) => q.id !== id));
}

export async function getQueueSummary(bitacoraId?: string): Promise<QueueSummary> {
  const queue = await loadReportQueue();
  const filtered = bitacoraId ? queue.filter((q) => q.bitacoraId === bitacoraId) : queue;
  const pending = filtered.filter((q) => q.attempts < MAX_REPORT_ATTEMPTS).length;
  const failed = filtered.filter((q) => q.attempts >= MAX_REPORT_ATTEMPTS).length;
  return { pending, failed, total: filtered.length };
}

export async function getPendingReports(bitacoraId?: string): Promise<QueuedReport[]> {
  const queue = await loadReportQueue();
  return queue
    .filter((q) => {
      if (bitacoraId && q.bitacoraId !== bitacoraId) return false;
      return q.attempts < MAX_REPORT_ATTEMPTS;
    })
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getFailedReports(bitacoraId?: string): Promise<QueuedReport[]> {
  const queue = await loadReportQueue();
  return queue.filter((q) => {
    if (bitacoraId && q.bitacoraId !== bitacoraId) return false;
    return q.attempts >= MAX_REPORT_ATTEMPTS;
  });
}

export async function resetFailedReportAttempts(id: string): Promise<void> {
  await updateReportQueueItem(id, { attempts: 0, lastError: undefined, lastAttemptAt: 0 });
}
