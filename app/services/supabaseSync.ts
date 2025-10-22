import { useCallback } from 'react';
import { supabase } from './supabase';
import { useTransactionRepository } from '../db/repository';
import { useCategoryRepository } from '../db/repository';

export const useSupabaseSync = () => {
  const { transactions, upsertTransaction } = useTransactionRepository();
  const { categories, upsertCategory } = useCategoryRepository();

  /**
   * Push local transactions to Supabase
   */
  const pushTransactions = useCallback(
    async (): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return { success: false, error: 'Not authenticated' };
        }

        const localTransactions = Array.from(transactions).map((txn) => ({
          id: txn.id,
          user_id: user.id,
          type: txn.type,
          amount_cents: txn.amountCents,
          category_id: txn.categoryId,
          timestamp: txn.timestamp.toISOString(),
          deleted_at: txn.deleted ? new Date().toISOString() : null,
          updated_at: txn.updatedAt.toISOString(),
        }));

        // Upsert transactions to Supabase
        const { error } = await supabase
          .from('transactions')
          .upsert(localTransactions, {
            onConflict: 'id',
          });

        if (error) {
          console.error('[SupabaseSync] Push transactions error:', error);
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (error) {
        console.error('[SupabaseSync] Push transactions exception:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to sync transactions' 
        };
      }
    },
    [transactions],
  );

  /**
   * Pull transactions from Supabase
   */
  const pullTransactions = useCallback(
    async (since?: Date): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return { success: false, error: 'Not authenticated' };
        }

        let query = supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id);

        if (since) {
          query = query.gt('updated_at', since.toISOString());
        }

        const { data, error } = await query;

        if (error) {
          console.error('[SupabaseSync] Pull transactions error:', error);
          return { success: false, error: error.message };
        }

        // Merge cloud transactions into local database
        data?.forEach((txn) => {
          upsertTransaction({
            id: txn.id,
            type: txn.type as 'expense' | 'income',
            amountCents: txn.amount_cents,
            categoryId: txn.category_id,
            timestamp: new Date(txn.timestamp),
            syncStatus: 'synced',
            deleted: txn.deleted_at !== null,
          });
        });

        return { success: true };
      } catch (error) {
        console.error('[SupabaseSync] Pull transactions exception:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to sync transactions' 
        };
      }
    },
    [upsertTransaction],
  );

  /**
   * Push local categories to Supabase
   */
  const pushCategories = useCallback(
    async (): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return { success: false, error: 'Not authenticated' };
        }

        const localCategories = Array.from(categories)
          .filter(cat => cat.userDefined) // Only sync user-defined categories
          .map((cat) => ({
            id: cat.id,
            user_id: user.id,
            name: cat.name,
            icon: cat.icon,
            deleted_at: null,
            updated_at: cat.updatedAt.toISOString(),
          }));

        if (localCategories.length === 0) {
          return { success: true };
        }

        const { error } = await supabase
          .from('categories')
          .upsert(localCategories, {
            onConflict: 'id',
          });

        if (error) {
          console.error('[SupabaseSync] Push categories error:', error);
          return { success: false, error: error.message };
        }

        return { success: true };
      } catch (error) {
        console.error('[SupabaseSync] Push categories exception:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to sync categories' 
        };
      }
    },
    [categories],
  );

  /**
   * Pull categories from Supabase
   */
  const pullCategories = useCallback(
    async (): Promise<{ success: boolean; error?: string }> => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          return { success: false, error: 'Not authenticated' };
        }

        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .is('deleted_at', null);

        if (error) {
          console.error('[SupabaseSync] Pull categories error:', error);
          return { success: false, error: error.message };
        }

        // Merge cloud categories into local database
        data?.forEach((cat) => {
          upsertCategory({
            id: cat.id,
            name: cat.name,
            icon: cat.icon,
            userDefined: true,
            createdAt: new Date(cat.created_at),
            updatedAt: new Date(cat.updated_at),
          });
        });

        return { success: true };
      } catch (error) {
        console.error('[SupabaseSync] Pull categories exception:', error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to sync categories' 
        };
      }
    },
    [upsertCategory],
  );

  /**
   * Bidirectional sync - pull first, then push
   * @param isInitialSync - If true, syncs all data. If false, only syncs changes since last sync.
   * @param lastSyncAt - Optional timestamp of last successful sync for incremental sync
   */
  const syncAll = useCallback(
    async (isInitialSync: boolean = false, lastSyncAt?: Date): Promise<{ success: boolean; error?: string }> => {
      // For incremental sync, only pull changes since last sync
      const since = !isInitialSync && lastSyncAt ? lastSyncAt : undefined;

      // Pull categories first (always full sync for categories since they're small)
      const categoriesResult = await pullCategories();
      if (!categoriesResult.success) {
        return categoriesResult;
      }

      // Pull transactions (incremental if since is provided)
      const transactionsResult = await pullTransactions(since);
      if (!transactionsResult.success) {
        return transactionsResult;
      }

      // Push categories
      const pushCategoriesResult = await pushCategories();
      if (!pushCategoriesResult.success) {
        return pushCategoriesResult;
      }

      // Push transactions
      const pushTransactionsResult = await pushTransactions();
      return pushTransactionsResult;
    },
    [pullCategories, pullTransactions, pushCategories, pushTransactions],
  );

  /**
   * Set up real-time sync listeners
   */
  const setupRealtimeSync = useCallback(() => {
    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          console.log('[SupabaseSync] Transaction change:', payload);
          // Handle real-time updates
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const txn = payload.new as any;
            upsertTransaction({
              id: txn.id,
              type: txn.type,
              amountCents: txn.amount_cents,
              categoryId: txn.category_id,
              timestamp: new Date(txn.timestamp),
              syncStatus: 'synced',
              deleted: txn.deleted_at !== null,
            });
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories',
        },
        (payload) => {
          console.log('[SupabaseSync] Category change:', payload);
          // Handle real-time updates
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const cat = payload.new as any;
            upsertCategory({
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              userDefined: true,
              createdAt: new Date(cat.created_at),
              updatedAt: new Date(cat.updated_at),
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [upsertTransaction, upsertCategory]);

  return {
    pushTransactions,
    pullTransactions,
    pushCategories,
    pullCategories,
    syncAll,
    setupRealtimeSync,
  };
};
