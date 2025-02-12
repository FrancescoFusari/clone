
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getUnsyncedEntries, markEntrySynced, deleteOfflineEntry } from '@/lib/db';

export const useSyncEntries = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncEntries = async () => {
    if (!session?.user || isSyncing) return;

    setIsSyncing(true);
    try {
      const unsyncedEntries = await getUnsyncedEntries();
      if (unsyncedEntries.length === 0) return;

      let syncedCount = 0;
      for (const entry of unsyncedEntries) {
        try {
          const { data, error } = await supabase.functions.invoke('process-entry', {
            body: {
              content: entry.content,
              user_id: session.user.id,
              type: "text",
              folder: entry.folder
            }
          });

          if (error) {
            console.error('Error syncing entry:', error);
            continue;
          }

          await markEntrySynced(entry.id);
          await deleteOfflineEntry(entry.id);
          syncedCount++;
        } catch (error) {
          console.error('Error processing entry:', error);
        }
      }

      if (syncedCount > 0) {
        await queryClient.invalidateQueries({ queryKey: ['entries'] });
        toast({
          title: "Entries synchronized",
          description: `Successfully synced ${syncedCount} offline ${syncedCount === 1 ? 'entry' : 'entries'}.`,
        });
      }
    } catch (error) {
      console.error('Error during sync:', error);
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "There was a problem syncing your offline entries.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync when user logs in
  useEffect(() => {
    if (session?.user) {
      syncEntries();
    }
  }, [session?.user?.id]);

  // Sync when online status changes
  useEffect(() => {
    const handleOnline = () => {
      if (session?.user) {
        syncEntries();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [session?.user?.id]);

  return { isSyncing, syncEntries };
};
