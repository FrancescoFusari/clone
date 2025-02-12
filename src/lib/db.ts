
import Dexie, { type Table } from 'dexie';

// Define types for our stored data
export interface OfflineEntry {
  id: string;
  title: string;
  content: string;
  category: 'personal' | 'work' | 'social' | 'interests' | 'school';
  created_at: string;
  synced: boolean;
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
    synced: false,
  };

  await db.entries.add(newEntry);
  return newEntry;
};

export const getOfflineEntries = async () => {
  return await db.entries.toArray();
};

export const markEntrySynced = async (id: string) => {
  await db.entries.update(id, { synced: true });
};

export const getUnsyncedEntries = async () => {
  return await db.entries.where('synced').equals(false).toArray();
};
