import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { ReportSyncStatus } from '../components/ReportStatusBar';
import {
  enqueueRouteReport,
  processReportQueue,
  type EnqueueParams,
  type ProcessQueueResult,
} from '../lib/reportQueueService';
import {
  getFailedReports,
  getPendingReports,
  getQueueSummary,
  resetFailedReportAttempts,
} from '../lib/reportQueueStorage';

function deriveSyncStatus(pending: number, failed: number, processing: boolean): ReportSyncStatus {
  if (failed > 0) return 'error';
  if (pending > 0 || processing) return 'pending';
  return 'ok';
}

export function useReportQueue(bitacoraId: string | undefined, custodioId: string | undefined) {
  const [syncStatus, setSyncStatus] = useState<ReportSyncStatus>('ok');
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [processing, setProcessing] = useState(false);
  const mountedRef = useRef(true);

  const refreshSummary = useCallback(async () => {
    if (!bitacoraId) return;
    const summary = await getQueueSummary(bitacoraId);
    if (!mountedRef.current) return;
    setPendingCount(summary.pending);
    setFailedCount(summary.failed);
    setSyncStatus(deriveSyncStatus(summary.pending, summary.failed, false));
  }, [bitacoraId]);

  const flush = useCallback(
    async (options?: { force?: boolean }): Promise<ProcessQueueResult> => {
      if (!bitacoraId) return { sent: 0, failed: 0, remaining: 0 };

      const net = await NetInfo.fetch();
      const online = net.isConnected !== false && net.isInternetReachable !== false;
      const pending = await getPendingReports(bitacoraId);
      if (!pending.length) {
        await refreshSummary();
        return { sent: 0, failed: 0, remaining: 0 };
      }
      if (!online && !options?.force) {
        setSyncStatus('pending');
        setPendingCount(pending.length);
        return { sent: 0, failed: 0, remaining: pending.length };
      }

      setProcessing(true);
      setSyncStatus('pending');
      const result = await processReportQueue({
        bitacoraId,
        custodioId,
        force: options?.force,
      });
      setProcessing(false);
      await refreshSummary();
      return result;
    },
    [bitacoraId, custodioId, refreshSummary],
  );

  const enqueue = useCallback(
    async (params: EnqueueParams) => {
      const item = await enqueueRouteReport(params);
      await refreshSummary();
      void flush();
      return item;
    },
    [flush, refreshSummary],
  );

  const retryFailed = useCallback(async () => {
    if (!bitacoraId) return;
    const failed = await getFailedReports(bitacoraId);
    await Promise.all(failed.map((f) => resetFailedReportAttempts(f.id)));
    await refreshSummary();
    return flush({ force: true });
  }, [bitacoraId, flush, refreshSummary]);

  useEffect(() => {
    mountedRef.current = true;
    void refreshSummary();
    void flush();

    const interval = setInterval(() => {
      void flush();
    }, 20_000);

    const unsubNet = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        void flush();
      }
    });

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      unsubNet();
    };
  }, [flush, refreshSummary]);

  useEffect(() => {
    setSyncStatus(deriveSyncStatus(pendingCount, failedCount, processing));
  }, [pendingCount, failedCount, processing]);

  return {
    syncStatus,
    pendingCount,
    failedCount,
    processing,
    enqueue,
    flush,
    retryFailed,
    refreshSummary,
  };
}
