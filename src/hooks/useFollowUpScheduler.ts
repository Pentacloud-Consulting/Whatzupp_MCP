'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * useFollowUpScheduler
 * 
 * Client-side polling hook that periodically calls /api/followup/process
 * to trigger any due scheduled follow-up messages.
 * 
 * Runs every 30 seconds while the app is active.
 * When a follow-up is sent, dispatches a CustomEvent 'wz_followup_sent' so
 * the CRM panel and ChatWindow can update in real-time.
 */
export function useFollowUpScheduler(intervalMs: number = 30000) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const processFollowUps = useCallback(async () => {
    // Prevent overlapping calls
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const res = await fetch('/api/followup/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger: 'client-scheduler' }),
      });

      if (!res.ok) {
        console.warn('[FollowUpScheduler] Process endpoint returned', res.status);
        return;
      }

      const data = await res.json();

      if (data.processed > 0) {
        console.log(`[FollowUpScheduler] ✅ Processed ${data.processed} follow-up(s). Sent: ${data.sent}, Failed: ${data.failed}`);

        // Notify all listening components (CrmIntelligencePanel, ChatWindow, etc.)
        if (data.results) {
          for (const result of data.results) {
            window.dispatchEvent(new CustomEvent('wz_followup_sent', {
              detail: {
                id: result.id,
                contactName: result.contactName,
                status: result.status,
                messageId: result.messageId,
                error: result.error,
              },
            }));
          }
        }

        // Also trigger the follow-up list refresh
        window.dispatchEvent(new CustomEvent('wz_followup_updated', {
          detail: { source: 'scheduler', results: data.results },
        }));
      }
    } catch (err) {
      // Silent fail — scheduler will retry next tick
      console.warn('[FollowUpScheduler] Process error:', err);
    } finally {
      isProcessingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Run immediately on mount to catch any due follow-ups
    processFollowUps();

    // Then poll every intervalMs
    intervalRef.current = setInterval(processFollowUps, intervalMs);

    // Also listen for page visibility to process when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        processFollowUps();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [processFollowUps, intervalMs]);
}
