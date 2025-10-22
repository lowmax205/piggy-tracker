import React, { useCallback, useMemo, useRef } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../state/theme';
import { useTransactionsService } from '../services/transactions';
import { useAppStore } from '../state/store';
import { TransactionListItem, type CategoryIconName } from '../components/TransactionListItem';
import { useCategoriesService } from '../services/categories';

const FILTERS: Array<{ label: string; value: 'all' | 'expense' | 'income' }> = [
  { label: 'All', value: 'all' },
  { label: 'Expenses', value: 'expense' },
  { label: 'Income', value: 'income' },
];

const FALLBACK_ICON: CategoryIconName = 'wallet-outline';

const HistoryScreen = () => {
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { transactions, markDeleted } = useTransactionsService();
  const { categories } = useCategoriesService();
  const { historyFilter, setHistoryFilter, openTransactionModal } = useAppStore();

  useFocusEffect(
    React.useCallback(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }, [])
  );

  const categoryMap = useMemo(() => {
    const map = new Map<string, { name: string; icon: string }>();
    categories.forEach((category) => {
      map.set(category.id, { name: category.name, icon: category.icon });
    });
    return map;
  }, [categories]);

  const transactionItems = useMemo(() => {
    const all = Array.from(transactions).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (historyFilter === 'all') {
      return all;
    }
    return all.filter((txn) => txn.type === historyFilter);
  }, [transactions, historyFilter]);

  const emptyStateMessage = useMemo(() => {
    if (historyFilter === 'expense') {
      return 'No expenses logged yet. Add your first expense to see it here.';
    }
    if (historyFilter === 'income') {
      return 'No income entries recorded yet. Track income to view it here.';
    }
    return 'No transactions yet. Tap the + button to log your first transaction.';
  }, [historyFilter]);

  const handleEdit = useCallback(
    (id: string) => {
      openTransactionModal('edit', id);
    },
    [openTransactionModal],
  );

  const confirmDelete = useCallback(
    (id: string) => {
      Alert.alert('Delete transaction', 'Are you sure you want to delete this transaction?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            markDeleted(id);
          },
        },
      ]);
    },
    [markDeleted],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>History</Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>Review and manage your transactions.</Text>
      </View>

      <View style={[styles.filterRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
        {FILTERS.map((filter) => {
          const selected = historyFilter === filter.value;
          return (
            <Pressable
              key={filter.value}
              onPress={() => setHistoryFilter(filter.value)}
              style={[styles.filterButton, selected ? { backgroundColor: theme.colors.primary } : null]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.filterLabel, { color: selected ? '#fff' : theme.colors.text }]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {transactionItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: theme.colors.subtitle }]}>{emptyStateMessage}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={transactionItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const category = categoryMap.get(item.categoryId);
            const iconName = (category?.icon ?? FALLBACK_ICON) as CategoryIconName;
            return (
              <TransactionListItem
                id={item.id}
                categoryName={category?.name ?? 'Unknown'}
                categoryIcon={iconName}
                amountCents={item.amountCents}
                type={item.type}
                timestamp={item.timestamp}
                onEdit={handleEdit}
                onDelete={confirmDelete}
              />
            );
          }}
          contentContainerStyle={[styles.listContent, { paddingBottom: 120 + insets.bottom }]}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
          getItemLayout={(data, index) => ({
            length: 72,
            offset: 72 * index,
            index,
          })}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 24,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default HistoryScreen;
