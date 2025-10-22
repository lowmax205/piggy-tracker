import Realm from 'realm';
import { useCallback, useMemo } from 'react';
import { useObject, useQuery, useRealm } from './RealmProvider';
import {
  Transaction,
  Category,
  Preferences,
  type TransactionType,
  type SyncStatus,
} from './realmSchemas';

export type TransactionDraft = {
  id?: string;
  type: TransactionType;
  amountCents: number;
  categoryId: string;
  timestamp: Date;
  syncStatus?: SyncStatus;
  deleted?: boolean;
};

export type CategoryDraft = {
  id?: string;
  name: string;
  icon: string;
  userDefined?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const now = () => new Date();

const generateId = () => new Realm.BSON.UUID().toString();

export const useTransactionRepository = () => {
  const realm = useRealm();
  const transactions = useQuery(Transaction);

  const orderedTransactions = useMemo(() => transactions.sorted('timestamp', true), [transactions]);

  const upsertTransaction = useCallback(
    (draft: TransactionDraft) => {
      const id = draft.id ?? generateId();
      const timestamp = draft.timestamp ?? now();
      realm.write(() => {
        realm.create(
          Transaction,
          {
            id,
            type: draft.type,
            amountCents: draft.amountCents,
            categoryId: draft.categoryId,
            timestamp,
            updatedAt: now(),
            syncStatus: draft.syncStatus ?? 'local',
            deleted: draft.deleted ?? false,
          },
          Realm.UpdateMode.Modified,
        );
      });
      return id;
    },
    [realm],
  );

  const softDeleteTransaction = useCallback(
    (id: string) => {
      const txn = realm.objectForPrimaryKey(Transaction, id);
      if (!txn) {
        return false;
      }
      realm.write(() => {
        txn.deleted = true;
        txn.updatedAt = now();
        txn.syncStatus = 'local';
      });
      return true;
    },
    [realm],
  );

  const purgeTransaction = useCallback(
    (id: string) => {
      const txn = realm.objectForPrimaryKey(Transaction, id);
      if (!txn) {
        return false;
      }
      realm.write(() => {
        realm.delete(txn);
      });
      return true;
    },
    [realm],
  );

  return {
    transactions: orderedTransactions,
    upsertTransaction,
    softDeleteTransaction,
    purgeTransaction,
  };
};

export const useCategoryRepository = () => {
  const realm = useRealm();
  const categories = useQuery(Category);

  const orderedCategories = useMemo(() => categories.sorted('name', false), [categories]);

  const upsertCategory = useCallback(
    (draft: CategoryDraft) => {
      const id = draft.id ?? generateId();
      const timestamp = now();
      realm.write(() => {
        const existing = realm.objectForPrimaryKey(Category, id);
        const createdAt = existing?.createdAt ?? draft.createdAt ?? timestamp;
        const updatedAt = draft.updatedAt ?? timestamp;
        realm.create(
          Category,
          {
            id,
            name: draft.name,
            icon: draft.icon,
            userDefined: draft.userDefined ?? true,
            createdAt,
            updatedAt,
          },
          Realm.UpdateMode.Modified,
        );
      });
      return id;
    },
    [realm],
  );

  const deleteCategory = useCallback(
    (id: string, reassignedCategoryId?: string) => {
      const category = realm.objectForPrimaryKey(Category, id);
      if (!category) {
        return false;
      }

      realm.write(() => {
        if (reassignedCategoryId) {
          const affected = realm.objects(Transaction).filtered('categoryId == $0', id);
          affected.forEach((txn) => {
            txn.categoryId = reassignedCategoryId;
            txn.updatedAt = now();
            txn.syncStatus = 'local';
          });
        }
        realm.delete(category);
      });

      return true;
    },
    [realm],
  );

  return {
    categories: orderedCategories,
    upsertCategory,
    deleteCategory,
  };
};

export const usePreferences = () => {
  const realm = useRealm();
  const preferences = useObject(Preferences, 'preferences');

  const ensurePreferences = useCallback(() => {
    if (!preferences) {
      realm.write(() => {
        realm.create(Preferences, {
          id: 'preferences',
          theme: 'light',
          dashboardPeriod: 'month-to-date',
          currency: 'USD',
          lastOpenedAt: now(),
        });
      });
    }
  }, [preferences, realm]);

  const setTheme = useCallback(
    (theme: 'light' | 'dark') => {
      ensurePreferences();
      const prefs = realm.objectForPrimaryKey(Preferences, 'preferences');
      if (!prefs) {
        return;
      }
      realm.write(() => {
        prefs.theme = theme;
        prefs.lastOpenedAt = now();
      });
    },
    [ensurePreferences, realm],
  );

  const touchLastOpened = useCallback(() => {
    ensurePreferences();
    const prefs = realm.objectForPrimaryKey(Preferences, 'preferences');
    if (!prefs) {
      return;
    }
    realm.write(() => {
      prefs.lastOpenedAt = now();
    });
  }, [ensurePreferences, realm]);

  const updatePreferences = useCallback(
    (
      updates: Partial<{
        currency: string;
        theme: 'light' | 'dark';
        lastSyncAt: Date | null;
        syncToken: string | null;
      }>,
    ) => {
      ensurePreferences();
      const prefs = realm.objectForPrimaryKey(Preferences, 'preferences');
      if (!prefs) {
        return;
      }
      realm.write(() => {
        if (updates.currency !== undefined) {
          prefs.currency = updates.currency;
        }
        if (updates.theme !== undefined) {
          prefs.theme = updates.theme;
        }
        if (updates.lastSyncAt !== undefined) {
          // Allow setting to a Date or clearing by passing null
          // Realm optional date can be set to null
          prefs.lastSyncAt = updates.lastSyncAt;
        }
        if (updates.syncToken !== undefined) {
          prefs.syncToken = updates.syncToken;
        }
        prefs.lastOpenedAt = now();
      });
    },
    [ensurePreferences, realm],
  );

  return {
    preferences,
    setTheme,
    touchLastOpened,
    updatePreferences,
  };
};
