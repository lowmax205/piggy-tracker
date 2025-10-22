import { z } from 'zod';
import type { TransactionType } from '../db/realmSchemas';

const amountInputSchema = z
  .union([z.number(), z.string().min(1)])
  .transform((value) => {
    if (typeof value === 'number') {
      return value;
    }
    const normalized = value.replace(/[^0-9.,-]/g, '').replace(',', '.');
    return Number.parseFloat(normalized);
  })
  .pipe(
    z
      .number({ invalid_type_error: 'Amount must be a number' })
      .refine((value) => Number.isFinite(value), 'Amount must be finite')
      .refine((value) => Math.abs(value) >= 0.01, 'Amount must be at least 0.01')
      .transform((value) => Math.round(Math.abs(value) * 100)),
  );

const timestampSchema = z
  .union([z.date(), z.string().min(1)])
  .transform((input) => {
    if (input instanceof Date) {
      return input;
    }
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error('Invalid timestamp');
    }
    return parsed;
  });

const transactionTypeSchema = z.custom<TransactionType>((value) => value === 'expense' || value === 'income', {
  message: 'Invalid transaction type',
});

export const transactionDraftSchema = z.object({
  id: z.string().uuid().optional(),
  type: transactionTypeSchema,
  amount: amountInputSchema,
  categoryId: z.string().min(1, 'Category is required'),
  timestamp: timestampSchema.default(() => new Date()),
});

export type ValidatedTransactionDraft = {
  id?: string;
  type: TransactionType;
  amountCents: number;
  categoryId: string;
  timestamp: Date;
};

export const validateTransactionDraft = (input: unknown): ValidatedTransactionDraft => {
  const parsed = transactionDraftSchema.parse(input);
  return {
    id: parsed.id,
    type: parsed.type,
    amountCents: parsed.amount,
    categoryId: parsed.categoryId,
    timestamp: parsed.timestamp,
  };
};

export const categoryDraftSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(40, 'Name is too long'),
  icon: z.string().min(1, 'Icon is required'),
  userDefined: z.boolean().optional(),
});

export type ValidatedCategoryDraft = z.infer<typeof categoryDraftSchema>;

export const validateCategoryDraft = (input: unknown): ValidatedCategoryDraft => categoryDraftSchema.parse(input);

export const amountInputFormatter = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatAmountPreview = (amountCents: number, currency = 'USD') =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountCents / 100);

export const isValidAmountInput = (value: string | number) => {
  try {
    amountInputSchema.parse(value);
    return true;
  } catch (_error) {
    return false;
  }
};
