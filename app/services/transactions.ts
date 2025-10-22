import { useCallback, useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import Realm from 'realm';
import { useRealm } from '../db/RealmProvider';
import { Transaction } from '../db/realmSchemas';
import { useTransactionRepository } from '../db/repository';
import { validateTransactionDraft, type ValidatedTransactionDraft } from '../lib/validation';

export type TransactionInput = {
  id?: string;
  type: 'expense' | 'income';
  amount: number | string;
  categoryId: string;
  timestamp?: Date;
};

const createTransactionId = () => new Realm.BSON.UUID().toString();

export const useTransactionsService = () => {
  const realm = useRealm();
  const { transactions, upsertTransaction, softDeleteTransaction, purgeTransaction } = useTransactionRepository();
  const syncCallbackRef = useRef<(() => void) | null>(null);

  const activeTransactions = useMemo(
    () => transactions.filtered('deleted == false'),
    [transactions],
  );

  const monthToDateTransactions = useCallback(() => {
    const startOfMonth = dayjs().startOf('month').toDate();
    return activeTransactions.filtered('timestamp >= $0', startOfMonth);
  }, [activeTransactions]);

  const saveTransaction = useCallback(
    (input: TransactionInput) => {
      const transactionPayload: ValidatedTransactionDraft = validateTransactionDraft({
        id: input.id,
        type: input.type,
        amount: input.amount,
        categoryId: input.categoryId,
        timestamp: input.timestamp ?? new Date(),
      });

      const id = transactionPayload.id ?? createTransactionId();
      upsertTransaction({
        id,
        type: transactionPayload.type,
        amountCents: transactionPayload.amountCents,
        categoryId: transactionPayload.categoryId,
        timestamp: transactionPayload.timestamp,
        syncStatus: 'local',
        deleted: false,
      });

      if (syncCallbackRef.current) {
        syncCallbackRef.current();
      }

      return id;
    },
    [upsertTransaction],
  );

  const markDeleted = useCallback(
    (id: string) => softDeleteTransaction(id),
    [softDeleteTransaction],
  );

  const removePermanently = useCallback(
    (id: string) => purgeTransaction(id),
    [purgeTransaction],
  );

  const getTransactionById = useCallback(
    (id: string) => realm.objectForPrimaryKey(Transaction, id),
    [realm],
  );

  const totalIncomeCents = useCallback(
    (source = activeTransactions) => source.filtered("type == 'income'").sum('amountCents') as number,
    [activeTransactions],
  );

  const totalExpenseCents = useCallback(
    (source = activeTransactions) => source.filtered("type == 'expense'").sum('amountCents') as number,
    [activeTransactions],
  );

  const remainingBalanceCents = useCallback(
    (source = activeTransactions) => totalIncomeCents(source) - totalExpenseCents(source),
    [activeTransactions, totalExpenseCents, totalIncomeCents],
  );

  const registerSyncCallback = useCallback((callback: () => void) => {
    syncCallbackRef.current = callback;
  }, []);

  useEffect(() => {
    // Sync callback registration happens at app level
  }, []);

  return {
    transactions: activeTransactions,
    monthToDateTransactions,
    saveTransaction,
    getTransactionById,
    markDeleted,
    removePermanently,
    totalIncomeCents,
    totalExpenseCents,
    remainingBalanceCents,
    registerSyncCallback,
  };
};
