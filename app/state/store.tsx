import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type TransactionModalMode = 'create' | 'edit';

export type TransactionModalState = {
  visible: boolean;
  mode: TransactionModalMode;
  transactionId?: string | null;
};

export type HistoryFilter = 'all' | 'expense' | 'income';

export type AppStoreContextValue = {
  transactionModal: TransactionModalState;
  openTransactionModal: (mode: TransactionModalMode, transactionId?: string | null) => void;
  closeTransactionModal: () => void;
  historyFilter: HistoryFilter;
  setHistoryFilter: (filter: HistoryFilter) => void;
};

const DEFAULT_MODAL_STATE: TransactionModalState = {
  visible: false,
  mode: 'create',
  transactionId: null,
};

const AppStoreContext = createContext<AppStoreContextValue | undefined>(undefined);

export const AppStoreProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [transactionModal, setTransactionModal] = useState<TransactionModalState>(DEFAULT_MODAL_STATE);
  const [historyFilter, setHistoryFilterState] = useState<HistoryFilter>('all');

  const openTransactionModal = useCallback((mode: TransactionModalMode, transactionId?: string | null) => {
    setTransactionModal({
      visible: true,
      mode,
      transactionId: transactionId ?? null,
    });
  }, []);

  const closeTransactionModal = useCallback(() => {
    setTransactionModal(DEFAULT_MODAL_STATE);
  }, []);

  const setHistoryFilter = useCallback((filter: HistoryFilter) => {
    setHistoryFilterState(filter);
  }, []);

  const value = useMemo<AppStoreContextValue>(
    () => ({ transactionModal, openTransactionModal, closeTransactionModal, historyFilter, setHistoryFilter }),
    [transactionModal, openTransactionModal, closeTransactionModal, historyFilter, setHistoryFilter],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
};

export const useAppStore = (): AppStoreContextValue => {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppStoreProvider');
  }
  return context;
};
