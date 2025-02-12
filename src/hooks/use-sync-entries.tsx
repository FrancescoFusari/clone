
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { 
  getNextSyncItem, 
  incrementSyncRetries, 
  removeSyncQueueItem, 
  markEntrySynced,
  deleteOfflineEntry,
  getSyncQueue
} from '@/lib/db';

export const useSyncEntries = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueSize, setQueueSize] = useState(0);

  const updateQueueSize = async () => {
    const queue = await getSyncQueue();
    setQueueSize(queue.length);
  };

  const processSyncItem = async () => {
    const item = await getNextSyncItem();
    if (!item || !session?.user) return false;

    try {
      switch (item.operation) {
        case 'create':
        case 'update':
          const { error } = await supabase.functions.invoke('process-entry', {
            body: {
              content: item.data.content,
              user_id: session.user.id,
              type: "text",
              folder: item.data.folder
            }
          });

          if (error) throw error;
          
          await markEntrySynced(item.data.id);
          await removeSyncQueueItem(item.id);
          break;

        case 'delete':
          // Handle delete operation if needed
          await removeSyncQueueItem(item.id);
          break;
      }
      return true;
    } catch (error) {
      console.error('Error processing sync item:', error);
      await incrementSyncRetries(item.id);
      return false;
    }
  };

  const syncEntries = async () => {
    if (!session?.user || isSyncing) return;

    setIsSyncing(true);
    try {
      let successCount = 0;
      let hasMore = true;

      while (hasMore) {
        hasMore = await processSyncItem();
        if (hasMore) successCount++;
      }

      if (successCount > 0) {
        await queryClient.invalidateQueries({ queryKey: ['entries'] });
        toast({
          title: "Entries synchronized",
          description: `Successfully synced ${successCount} ${successCount === 1 ? 'entry' : 'entries'}.`,
        });
      }

      await updateQueueSize();
    } catch (error) {
      console.error('Error during sync:', error);
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "There was a problem syncing your entries.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Update queue size when component mounts
  useEffect(() => {
    updateQueueSize();
  }, []);

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

  return { isSyncing, syncEntries, queueSize };
};
