import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../state/store';
import { useTheme } from '../state/theme';
import { CategoryGrid } from './CategoryGrid';
import { useCategoriesService } from '../services/categories';
import { useTransactionsService } from '../services/transactions';
import { formatCurrency } from '../lib/format';
import { measureModalOpen } from '../lib/perf';

const getAmountCents = (amount: string) => {
  const normalized = Number.parseFloat(amount);
  if (Number.isNaN(normalized)) {
    return 0;
  }
  return Math.round(normalized * 100);
};

export const TransactionModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { transactionModal, closeTransactionModal } = useAppStore();
  const { theme } = useTheme();
  const { categories } = useCategoriesService();
  const { saveTransaction, getTransactionById } = useTransactionsService();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('0');
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const visible = transactionModal.visible;

  useEffect(() => {
    if (visible) {
      measureModalOpen(true);
      
      if (transactionModal.mode === 'edit' && transactionModal.transactionId) {
        const existing = getTransactionById(transactionModal.transactionId);
        if (existing) {
          setType(existing.type);
          setAmount((existing.amountCents / 100).toFixed(2));
          setCategoryId(existing.categoryId);
        }
      } else {
        setType('expense');
        setAmount('0');
        setCategoryId(categories.length > 0 ? categories[0].id : undefined);
      }
      setError(null);
      
      // Measure modal open completion
      setTimeout(() => measureModalOpen(false), 0);
    } else {
      setAmount('0');
      setCategoryId(undefined);
      setError(null);
    }
  }, [visible, transactionModal.mode, transactionModal.transactionId, categories, getTransactionById]);

  const amountCents = useMemo(() => getAmountCents(amount), [amount]);

  const categoryItems = useMemo(
    () =>
      Array.from(categories).map((category) => ({
        id: category.id,
        name: category.name,
        icon: category.icon as React.ComponentProps<typeof Ionicons>['name'],
      })),
    [categories],
  );

  const primaryActionLabel = transactionModal.mode === 'edit' ? 'Update' : 'Save';

  const handleSubmit = () => {
    if (!categoryId) {
      setError('Please select a category');
      return;
    }
    if (amountCents <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    try {
      saveTransaction({
        id:
          transactionModal.mode === 'edit' && transactionModal.transactionId
            ? transactionModal.transactionId
            : undefined,
        type,
        amount,
        categoryId,
      });
      closeTransactionModal();
    } catch (err) {
      console.error('[TransactionModal] Failed to save transaction', err);
      setError('Unable to save transaction. Please try again.');
    }
  };

  const handleAmountChange = (text: string) => {
    // Allow only numbers and decimal point
    let sanitized = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = sanitized.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      return;
    }
    
    // Remove leading zeros, but keep '0' if it's the only character or before a decimal
    if (sanitized.length > 1 && sanitized[0] === '0' && sanitized[1] !== '.') {
      sanitized = sanitized.replace(/^0+/, '');
    }
    
    setAmount(sanitized || '0');
  };

  const modalBackground = {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={closeTransactionModal}>
      <KeyboardAvoidingView 
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -50}
      >
        <Pressable style={styles.backdrop} onPress={closeTransactionModal}>
          <View />
        </Pressable>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.sheet, modalBackground, { paddingBottom: Math.max(20 + insets.bottom, 40) }]}>
            <View style={styles.dragHandle} />
            <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{transactionModal.mode === 'edit' ? 'Edit Transaction' : 'New Transaction'}</Text>
            <Pressable onPress={closeTransactionModal} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={theme.colors.subtitle} />
            </Pressable>
          </View>
          <View style={styles.segmentedControl}>
            {(['expense', 'income'] as const).map((option) => {
              const selected = type === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.segmentButton, selected ? { backgroundColor: theme.colors.primary } : { borderColor: theme.colors.border }]}
                  onPress={() => setType(option)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={[styles.segmentLabel, { color: selected ? '#fff' : theme.colors.text }]}>
                    {option === 'expense' ? 'Expense' : 'Income'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.amountContainer}>
            <Text style={[styles.amountLabel, { color: theme.colors.subtitle }]}>Amount</Text>
            <TextInput
              style={[styles.amountInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={theme.colors.subtitle}
              autoFocus={transactionModal.mode === 'create'}
            />
          </View>
          <Text style={[styles.sectionLabel, { color: theme.colors.subtitle }]}>Category</Text>
          <CategoryGrid categories={categoryItems} selectedId={categoryId} onSelect={setCategoryId} />
          {error ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>{error}</Text> : null}
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: theme.colors.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
            onPress={handleSubmit}
            accessibilityRole="button"
            accessibilityLabel={primaryActionLabel}
          >
            <Text style={styles.submitButtonText}>{primaryActionLabel}</Text>
          </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5F5',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginHorizontal: 4,
  },
  segmentLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  amountContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 32,
    fontWeight: '700',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'center',
  },
  amountPreview: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
