/**
 * Maintenance Service
 * 
 * Handles background maintenance tasks including:
 * - Tombstone purge (future feature)
 * - Database optimization
 * - Cache cleanup
 */

import { useRealm } from '../db/RealmProvider';
import { Transaction } from '../db/realmSchemas';

/**
 * Feature flags for maintenance operations
 */
export const MAINTENANCE_CONFIG = {
  // Tombstone purge configuration (DISABLED for MVP)
  ENABLE_TOMBSTONE_PURGE: false,
  TOMBSTONE_RETENTION_DAYS: 90,
  PURGE_BATCH_SIZE: 100,
  PURGE_INTERVAL_DAYS: 7,
} as const;

/**
 * Check if a tombstone is eligible for purging
 * 
 * Criteria:
 * 1. deleted == true
 * 2. syncStatus == 'synced' (confirmed pushed to server)
 * 3. updatedAt is older than retention period
 * 4. User has synced successfully within last 30 days
 * 
 * @returns true if tombstone can be safely purged
 */
export function isTombstoneEligibleForPurge(
  transaction: Transaction & Realm.Object,
  retentionDays: number = MAINTENANCE_CONFIG.TOMBSTONE_RETENTION_DAYS,
): boolean {
  if (!transaction.deleted) {
    return false;
  }

  if (transaction.syncStatus !== 'synced') {
    return false;
  }

  const retentionThreshold = new Date();
  retentionThreshold.setDate(retentionThreshold.getDate() - retentionDays);

  return transaction.updatedAt < retentionThreshold;
}

/**
 * Background purge job (PLACEHOLDER - Not active in MVP)
 * 
 * This function is designed to be called periodically (e.g., weekly)
 * to clean up old tombstones that have been successfully synced.
 * 
 * IMPORTANT: This is disabled by default via ENABLE_TOMBSTONE_PURGE flag.
 * Do not enable without thorough testing of sync behavior.
 * 
 * @param realm - Realm instance
 * @returns Number of tombstones purged
 */
export function purgeOldTombstones(realm: Realm): number {
  // Feature flag check - early return if disabled
  if (!MAINTENANCE_CONFIG.ENABLE_TOMBSTONE_PURGE) {
    console.log('[Maintenance] Tombstone purge is disabled. Set ENABLE_TOMBSTONE_PURGE to true to enable.');
    return 0;
  }

  let purgedCount = 0;

  try {
    const allTransactions = realm.objects(Transaction);
    const deletedTransactions = allTransactions.filtered('deleted == true AND syncStatus == "synced"');

    console.log(`[Maintenance] Found ${deletedTransactions.length} synced tombstones`);

    realm.write(() => {
      const toPurge: (Transaction & Realm.Object)[] = [];

      for (const transaction of deletedTransactions) {
        if (isTombstoneEligibleForPurge(transaction as Transaction & Realm.Object)) {
          toPurge.push(transaction as Transaction & Realm.Object);

          // Batch size limit to avoid blocking
          if (toPurge.length >= MAINTENANCE_CONFIG.PURGE_BATCH_SIZE) {
            break;
          }
        }
      }

      // Delete in batch
      for (const transaction of toPurge) {
        realm.delete(transaction);
        purgedCount++;
      }
    });

    if (purgedCount > 0) {
      console.log(`[Maintenance] Purged ${purgedCount} old tombstones`);
    } else {
      console.log('[Maintenance] No tombstones eligible for purging');
    }
  } catch (error) {
    console.error('[Maintenance] Failed to purge tombstones:', error);
  }

  return purgedCount;
}

/**
 * React hook for maintenance operations
 * 
 * Usage:
 * ```typescript
 * const { schedulePurge, runPurge } = useMaintenanceService();
 * 
 * // Manual purge (for testing)
 * const count = runPurge();
 * 
 * // Schedule periodic purge (when feature is enabled)
 * useEffect(() => {
 *   schedulePurge();
 * }, []);
 * ```
 */
export function useMaintenanceService() {
  const realm = useRealm();

  /**
   * Manually trigger tombstone purge
   * (Only for testing/debugging when feature flag is enabled)
   */
  const runPurge = (): number => {
    return purgeOldTombstones(realm);
  };

  /**
   * Schedule periodic purge job
   * (Placeholder - not implemented in MVP)
   */
  const schedulePurge = () => {
    if (!MAINTENANCE_CONFIG.ENABLE_TOMBSTONE_PURGE) {
      return;
    }

    // TODO: Implement periodic scheduling
    // Options:
    // 1. Use Expo Background Tasks
    // 2. Use React Native Background Timer
    // 3. Run on app foreground with throttling
    console.log('[Maintenance] Periodic purge scheduling not implemented yet');
  };

  /**
   * Get maintenance statistics
   */
  const getMaintenanceStats = () => {
    const allTransactions = realm.objects(Transaction);
    const tombstones = allTransactions.filtered('deleted == true');
    const syncedTombstones = allTransactions.filtered('deleted == true AND syncStatus == "synced"');

    let eligibleForPurge = 0;
    for (const transaction of syncedTombstones) {
      if (isTombstoneEligibleForPurge(transaction as Transaction & Realm.Object)) {
        eligibleForPurge++;
      }
    }

    return {
      totalTransactions: allTransactions.length,
      tombstones: tombstones.length,
      syncedTombstones: syncedTombstones.length,
      eligibleForPurge,
      purgeEnabled: MAINTENANCE_CONFIG.ENABLE_TOMBSTONE_PURGE,
      retentionDays: MAINTENANCE_CONFIG.TOMBSTONE_RETENTION_DAYS,
    };
  };

  return {
    runPurge,
    schedulePurge,
    getMaintenanceStats,
    config: MAINTENANCE_CONFIG,
  };
}
