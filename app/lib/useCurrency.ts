import { useCallback } from 'react';
import { usePreferences } from '../db/repository';
import { formatCurrency as baseCurrencyFormat } from './format';

export const useCurrency = () => {
  const { preferences } = usePreferences();
  const currency = preferences?.currency || 'USD';

  const formatCurrency = useCallback(
    (amountCents: number) => {
      return baseCurrencyFormat(amountCents, { currency });
    },
    [currency],
  );

  return { formatCurrency, currency };
};
