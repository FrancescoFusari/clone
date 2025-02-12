
import Dexie, { type Table } from 'dexie';

// Define types for our stored data
export interface OfflineEntry {
  id: string;
  title: string;
  content: string;
  category: 'personal' | 'work' | 'social' | 'interests' | 'school';
  created_at: string;
  synced: number; // Changed from boolean to number for IndexedDB compatibility
  user_id: string | null;
  entry_type?: string;
  tags?: string[];
  folder: string;
}

export interface SyncQueue {
  id: string;
  operation: 'create' | 'update' | 'delete';
  data: OfflineEntry;
  timestamp: string;
  retries: number;
}

export class AppDatabase extends Dexie {
  entries!: Table<OfflineEntry>;
  syncQueue!: Table<SyncQueue>;

  constructor() {
    super('lifeweaver');
    
    this.version(2).stores({
      entries: 'id, category, created_at, synced, user_id',
      syncQueue: 'id, operation, timestamp'
    });
  }
}

export const db = new AppDatabase();

// Helper functions for offline data management
export const addOfflineEntry = async (entry: Omit<OfflineEntry, 'id' | 'synced' | 'created_at'>) => {
  const newEntry: OfflineEntry = {
    ...entry,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    synced: 0, // 0 for false, 1 for true
  };

  await db.entries.add(newEntry);
  
  // Add to sync queue
  await addToSyncQueue('create', newEntry);
  
  return newEntry;
};

export const getOfflineEntries = async () => {
  return await db.entries.toArray();
};

export const markEntrySynced = async (id: string) => {
  await db.entries.update(id, { synced: 1 });
  // Remove from sync queue if present
  await db.syncQueue.where('id').equals(id).delete();
};

export const getUnsyncedEntries = async () => {
  return await db.entries.where('synced').equals(0).toArray();
};

export const deleteOfflineEntry = async (id: string) => {
  const entry = await db.entries.get(id);
  if (entry) {
    await addToSyncQueue('delete', entry);
  }
  await db.entries.delete(id);
};

// Sync queue management
export const addToSyncQueue = async (operation: 'create' | 'update' | 'delete', data: OfflineEntry) => {
  const queueItem: SyncQueue = {
    id: data.id,
    operation,
    data,
    timestamp: new Date().toISOString(),
    retries: 0
  };
  
  await db.syncQueue.put(queueItem);
};

export const getNextSyncItem = async () => {
  return await db.syncQueue
    .orderBy('timestamp')
    .filter(item => item.retries < 3)
    .first();
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

// Get all items in sync queue
export const getSyncQueue = async () => {
  return await db.syncQueue.toArray();
};

