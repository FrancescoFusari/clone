
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

export class AppDatabase extends Dexie {
  entries!: Table<OfflineEntry>;

  constructor() {
    super('lifeweaver');
    
    this.version(1).stores({
      entries: 'id, category, created_at, synced, user_id'
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
  return newEntry;
};

export const getOfflineEntries = async () => {
  return await db.entries.toArray();
};

export const markEntrySynced = async (id: string) => {
  await db.entries.update(id, { synced: 1 });
};

export const getUnsyncedEntries = async () => {
  return await db.entries.where('synced').equals(0).toArray();
};

export const deleteOfflineEntry = async (id: string) => {
  await db.entries.delete(id);
};
