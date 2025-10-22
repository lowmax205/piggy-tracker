import React, { useEffect, useRef } from 'react';
import { useAuthService } from '../services/auth';
import { useSupabaseSync } from '../services/supabaseSync';

export const SyncProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const authService = useAuthService();
  const { syncAll, setupRealtimeSync } = useSupabaseSync();
  const hasInitialSynced = useRef(false);
  const realtimeUnsubscribe = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (authService.status === 'authenticated' && !hasInitialSynced.current) {
      // Trigger initial sync on authentication
      console.log('[SyncProvider] User authenticated, triggering initial sync...');
      syncAll().then((result) => {
        if (result.success) {
          console.log('[SyncProvider] Initial sync completed successfully');
          hasInitialSynced.current = true;
          
          // Setup real-time sync after initial sync completes
          realtimeUnsubscribe.current = setupRealtimeSync();
        } else {
          console.error('[SyncProvider] Initial sync failed:', result.error);
        }
      });
    } else if (authService.status === 'guest') {
      // Clean up real-time sync when user logs out
      if (realtimeUnsubscribe.current) {
        realtimeUnsubscribe.current();
        realtimeUnsubscribe.current = null;
      }
      hasInitialSynced.current = false;
    }

    return () => {
      // Clean up on unmount
      if (realtimeUnsubscribe.current) {
        realtimeUnsubscribe.current();
      }
    };
  }, [authService.status, syncAll, setupRealtimeSync]);

  return <>{children}</>;
};
