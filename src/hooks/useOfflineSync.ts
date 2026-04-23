import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getPendingActions,
  getPendingCount,
  incrementRetry,
  markSynced,
  subscribeQueue,
  type OfflineAction,
} from "@/lib/offline/offlineQueue";

export type SyncStatus = "idle" | "syncing" | "error";

export interface UseOfflineSyncResult {
  isOnline: boolean;
  pendingCount: number;
  syncStatus: SyncStatus;
  syncNow: () => Promise<void>;
}

const MAX_RETRY = 5;

async function replayAction(action: OfflineAction): Promise<void> {
  const payload = action.payload as Record<string, unknown>;
  switch (action.type) {
    case "upsert_section": {
      const { error } = await supabase.rpc(
        "builder_upsert_section",
        payload as never,
      );
      if (error) throw new Error(error.message);
      return;
    }
    case "delete_section": {
      const { error } = await supabase.rpc(
        "builder_delete_section",
        payload as never,
      );
      if (error) throw new Error(error.message);
      return;
    }
    default:
      // Unknown action types are dropped (marked synced) to avoid blocking the queue.
      return;
  }
}

export function useOfflineSync(): UseOfflineSyncResult {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const syncingRef = useRef(false);

  const refreshCount = useCallback(async () => {
    try {
      const c = await getPendingCount();
      setPendingCount(c);
    } catch {
      // ignore
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (syncingRef.current) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    syncingRef.current = true;
    setSyncStatus("syncing");
    try {
      const pending = await getPendingActions();
      if (pending.length === 0) {
        setSyncStatus("idle");
        return;
      }

      toast.info(
        `You have ${pending.length} pending edit${pending.length === 1 ? "" : "s"}. Syncing...`,
      );

      let failures = 0;
      // Replay in timestamp order, sequentially, to preserve causality.
      for (const action of pending) {
        try {
          await replayAction(action);
          await markSynced(action.id);
        } catch (err) {
          failures += 1;
          await incrementRetry(action.id);
          if ((action.retryCount || 0) + 1 >= MAX_RETRY) {
            // Drop the action so the queue doesn't get stuck.
            await markSynced(action.id);
            console.error(
              "Offline action exceeded max retries, dropping",
              action,
              err,
            );
          } else {
            // Stop on first failure to keep order; retry on next tick.
            break;
          }
        }
      }

      await refreshCount();

      if (failures === 0) {
        setSyncStatus("idle");
        toast.success("Offline edits synced");
      } else {
        setSyncStatus("error");
      }
    } catch (err) {
      console.error("Offline sync failed", err);
      setSyncStatus("error");
    } finally {
      syncingRef.current = false;
    }
  }, [refreshCount]);

  // Track online/offline transitions.
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void syncNow();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("idle");
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncNow]);

  // Keep pending count fresh on queue mutations.
  useEffect(() => {
    void refreshCount();
    const unsub = subscribeQueue(() => {
      void refreshCount();
    });
    return unsub;
  }, [refreshCount]);

  // Attempt an initial sync if we boot online with a non-empty queue.
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.onLine) {
      void syncNow();
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, pendingCount, syncStatus, syncNow };
}