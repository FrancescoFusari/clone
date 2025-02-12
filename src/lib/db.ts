
import Dexie, { type Table } from 'dexie';

// Define types for our stored data
export interface OfflineEntry {
  id: string;
  title: string;
  content: string;
  category: 'personal' | 'work' | 'social' | 'interests' | 'school';
  created_at: string;
  updated_at: string;
  synced: number; // 0 = not synced, 1 = synced
  user_id: string | null;
  entry_type?: string;
  tags?: string[];
  folder: string;
  version?: number;
  conflict_with?: string;
}

export interface SyncQueue {
  id: string;
  operation: 'create' | 'update' | 'delete';
  data: OfflineEntry;
  timestamp: string;
  retries: number;
  has_conflict: number; // 0 = no conflict, 1 = has conflict
  server_version?: number;
}

export class AppDatabase extends Dexie {
  entries!: Table<OfflineEntry>;
  syncQueue!: Table<SyncQueue>;

  constructor() {
    super('lifeweaver');
    
    this.version(3).stores({
      entries: 'id, category, created_at, updated_at, synced, user_id, version',
      syncQueue: 'id, operation, timestamp, has_conflict'
    });
  }
}

export const db = new AppDatabase();

// Helper functions for offline data management
export const addOfflineEntry = async (entry: Omit<OfflineEntry, 'id' | 'synced' | 'created_at' | 'updated_at' | 'version'>) => {
  const now = new Date().toISOString();
  const newEntry: OfflineEntry = {
    ...entry,
    id: crypto.randomUUID(),
    created_at: now,
    updated_at: now,
    synced: 0,
    version: 1
  };

  await db.entries.add(newEntry);
  await addToSyncQueue('create', newEntry);
  
  return newEntry;
};

export const updateOfflineEntry = async (id: string, updates: Partial<OfflineEntry>) => {
  const entry = await db.entries.get(id);
  if (!entry) throw new Error('Entry not found');

  const updatedEntry: OfflineEntry = {
    ...entry,
    ...updates,
    updated_at: new Date().toISOString(),
    version: (entry.version || 1) + 1,
    synced: 0
  };

  await db.entries.put(updatedEntry);
  await addToSyncQueue('update', updatedEntry);

  return updatedEntry;
};

export const getOfflineEntries = async () => {
  return await db.entries.toArray();
};

export const markEntrySynced = async (id: string, serverVersion?: number) => {
  await db.entries.update(id, { 
    synced: 1,
    version: serverVersion || undefined 
  });
  await db.syncQueue.where('id').equals(id).delete();
};

export const getUnsyncedEntries = async () => {
  return await db.entries.where('synced').equals(0).toArray();
};

export const deleteOfflineEntry = async (id: string) => {
  const entry = await db.entries.get(id);
  if (entry) {
    await addToSyncQueue('delete', entry);
    await db.entries.delete(id);
  }
};

export const markEntryConflict = async (id: string, serverVersion: number) => {
  const queueItem = await db.syncQueue.get(id);
  if (queueItem) {
    await db.syncQueue.update(id, {
      has_conflict: 1,
      server_version: serverVersion
    });
  }
};

export const resolveConflict = async (id: string, keepLocal: boolean) => {
  const queueItem = await db.syncQueue.get(id);
  const entry = await db.entries.get(id);
  
  if (!queueItem || !entry) return;

  if (keepLocal) {
    // Force update with local version
    await addToSyncQueue('update', entry);
  } else {
    // Accept server version
    await db.entries.update(id, {
      version: queueItem.server_version,
      synced: 1
    });
    await db.syncQueue.delete(id);
  }
};

// Sync queue management
export const addToSyncQueue = async (operation: 'create' | 'update' | 'delete', data: OfflineEntry) => {
  const queueItem: SyncQueue = {
    id: data.id,
    operation,
    data,
    timestamp: new Date().toISOString(),
    retries: 0,
    has_conflict: 0
  };
  
  await db.syncQueue.put(queueItem);
};

export const getNextSyncItem = async () => {
  return await db.syncQueue
    .orderBy('timestamp')
    .filter(item => item.retries < 3 && item.has_conflict === 0)
    .first();
};

export const getConflictedItems = async () => {
  return await db.syncQueue
    .where('has_conflict')
    .equals(1)
    .toArray();
};

export const incrementSyncRetries = async (id: string) => {
  const item = await db.syncQueue.get(id);
  if (item) {
    await db.syncQueue.update(id, {
      retries: item.retries + 1
    });
  }
};

export const removeSyncQueueItem = async (id: string) => {
  await db.syncQueue.delete(id);
};

export const getSyncQueue = async () => {
  return await db.syncQueue.toArray();
};
