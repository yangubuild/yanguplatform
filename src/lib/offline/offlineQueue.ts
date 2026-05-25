// IndexedDB-backed offline action queue.
// Phase 1: queue-only (no service worker). Works in any browser tab,
// including the Lovable preview iframe.

const DB_NAME = "yangu_offline";
const DB_VERSION = 1;
const STORE_NAME = "yangu_offline_actions";

export type OfflineActionType =
  | "upsert_section"
  | "delete_section"
  | "add_to_cart"
  | "remove_from_cart"
  | "update_cart_quantity"
  | "edit"
  | "create"
  | "delete";

export interface OfflineAction<TPayload = unknown> {
  id: string;
  type: OfflineActionType;
  payload: TPayload;
  timestamp: number;
  retryCount: number;
  synced: boolean;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `oa_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by_timestamp", "timestamp", { unique: false });
        store.createIndex("by_synced", "synced", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Failed to open IndexedDB"));
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    let result: T;
    Promise.resolve(fn(store))
      .then((r) => {
        result = r;
      })
      .catch(reject);
    tx.oncomplete = () => {
      db.close();
      resolve(result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("IndexedDB transaction failed"));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error || new Error("IndexedDB transaction aborted"));
    };
  });
}

export async function addToQueue<TPayload>(
  action: { type: OfflineActionType; payload: TPayload },
): Promise<OfflineAction<TPayload>> {
  const record: OfflineAction<TPayload> = {
    id: uuid(),
    type: action.type,
    payload: action.payload,
    timestamp: Date.now(),
    retryCount: 0,
    synced: false,
  };
  await withStore("readwrite", (store) => {
    store.add(record);
  });
  notifyChange();
  return record;
}

export async function getPendingActions(): Promise<OfflineAction[]> {
  return withStore("readonly", (store) => {
    return new Promise<OfflineAction[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const all = (req.result as OfflineAction[]) || [];
        const pending = all
          .filter((a) => !a.synced)
          .sort((a, b) => a.timestamp - b.timestamp);
        resolve(pending);
      };
      req.onerror = () => reject(req.error);
    });
  });
}

export async function markSynced(id: string): Promise<void> {
  await withStore("readwrite", (store) => {
    return new Promise<void>((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const rec = getReq.result as OfflineAction | undefined;
        if (!rec) {
          resolve();
          return;
        }
        rec.synced = true;
        const putReq = store.put(rec);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  });
  notifyChange();
}

export async function incrementRetry(id: string): Promise<void> {
  await withStore("readwrite", (store) => {
    return new Promise<void>((resolve, reject) => {
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const rec = getReq.result as OfflineAction | undefined;
        if (!rec) {
          resolve();
          return;
        }
        rec.retryCount = (rec.retryCount || 0) + 1;
        const putReq = store.put(rec);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  });
}

export async function clearQueue(): Promise<void> {
  await withStore("readwrite", (store) => {
    store.clear();
  });
  notifyChange();
}

export async function getPendingCount(): Promise<number> {
  const pending = await getPendingActions();
  return pending.length;
}

// ─── Lightweight in-process change notifier ───
// Lets hooks (e.g. useOfflineSync) react to queue mutations without polling.
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeQueue(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyChange(): void {
  for (const l of Array.from(listeners)) {
    try {
      l();
    } catch {
      // ignore listener errors
    }
  }
}