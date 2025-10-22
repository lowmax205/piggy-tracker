import React, { useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/theme';
import { useTransactionsService } from '../services/transactions';
import { useCategoriesService } from '../services/categories';
import { formatDateTime, getMonthToDateRange } from '../lib/format';
import { useCurrency } from '../lib/useCurrency';

type CategorySummary = {
  id: string;
  name: string;
  amountCents: number;
  icon: string;
  percentage: number;
};

const DashboardScreen = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { formatCurrency } = useCurrency();
  const { monthToDateTransactions, totalIncomeCents, totalExpenseCents, remainingBalanceCents } = useTransactionsService();
  const { categories } = useCategoriesService();

  useFocusEffect(
    React.useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const monthRange = useMemo(() => getMonthToDateRange(), []);
  const monthTransactions = useMemo(() => monthToDateTransactions(), [monthToDateTransactions]);
  const monthTransactionArray = useMemo(() => Array.from(monthTransactions), [monthTransactions]);

  const hasTransactions = monthTransactionArray.length > 0;

  const income = totalIncomeCents(monthTransactions);
  const expenses = totalExpenseCents(monthTransactions);
  const balance = remainingBalanceCents(monthTransactions);

  const topCategories = useMemo(() => {
    if (monthTransactionArray.length === 0) {
      return [] as CategorySummary[];
    }
    const expenseTransactions = monthTransactionArray.filter((txn) => txn.type === 'expense');
    const totalExpense = expenseTransactions.reduce((sum, txn) => sum + txn.amountCents, 0);
    if (totalExpense === 0) {
      return [] as CategorySummary[];
    }
    const bucket = expenseTransactions.reduce<Record<string, number>>((acc, txn) => {
      acc[txn.categoryId] = (acc[txn.categoryId] ?? 0) + txn.amountCents;
      return acc;
    }, {});
    const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));
    return Object.entries(bucket)
      .map(([id, amountCents]) => {
        const category = categoryMap.get(id);
        return {
          id,
          name: category?.name ?? 'Unknown',
          icon: (category?.icon ?? 'wallet-outline') as string,
          amountCents,
          percentage: amountCents / totalExpense,
        } satisfies CategorySummary;
      })
      .sort((a, b) => b.amountCents - a.amountCents)
      .slice(0, 5);
  }, [categories, monthTransactionArray]);

  const recentTransactions = useMemo(
    () => monthTransactionArray.slice(0, 5),
    [monthTransactionArray],
  );

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: theme.colors.background }]} 
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: 120 + insets.bottom }]}
    >
      <Text style={[styles.heading, { color: theme.colors.text }]}>This Month</Text>
      <Text style={[styles.period, { color: theme.colors.subtitle }]}>Period: {formatDateTime(monthRange.start, 'LL')} - {formatDateTime(monthRange.end, 'LL')}</Text>

      <View style={styles.cardsRow}>
        <View style={[styles.cardWrapper, styles.cardWrapperRight]}>
          <MetricCard
            title="Remaining Balance"
            value={formatCurrency(balance)}
            tone={balance >= 0 ? theme.colors.success : theme.colors.danger}
            caption="Income minus expenses"
            surfaceColor={theme.colors.surface}
            borderColor={theme.colors.border}
            titleColor={theme.colors.subtitle}
            captionColor={theme.colors.subtitle}
          />
        </View>
        <View style={styles.cardWrapper}>
          <MetricCard
            title="Total Income"
            value={formatCurrency(income)}
            tone={theme.colors.success}
            caption="Month-to-date"
            surfaceColor={theme.colors.surface}
            borderColor={theme.colors.border}
            titleColor={theme.colors.subtitle}
            captionColor={theme.colors.subtitle}
          />
        </View>
      </View>

      <MetricCard
        title="Total Expenses"
        value={formatCurrency(expenses)}
        tone={theme.colors.danger}
        caption="Month-to-date"
        fullWidth
        surfaceColor={theme.colors.surface}
        borderColor={theme.colors.border}
        titleColor={theme.colors.subtitle}
        captionColor={theme.colors.subtitle}
      />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Top Spending Categories</Text>
        {topCategories.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.subtitle }]}>Log a few expenses to see category insights.</Text>
        ) : (
          topCategories.map((category) => (
            <CategoryRow
              key={category.id}
              name={category.name}
              icon={category.icon}
              amount={formatCurrency(category.amountCents)}
              percentage={category.percentage}
              tone={theme.colors.primary}
              textColor={theme.colors.text}
            />
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Activity</Text>
        {!hasTransactions ? (
          <Text style={[styles.emptyText, { color: theme.colors.subtitle }]}>No transactions yet. Tap the + button to log your first expense.</Text>
        ) : (
          recentTransactions.map((txn) => {
            const category = categories.find((cat) => cat.id === txn.categoryId);
            const isExpense = txn.type === 'expense';
            return (
              <View key={txn.id} style={[styles.recentRow, { borderBottomColor: theme.colors.border }]}> 
                <View>
                  <Text style={[styles.recentTitle, { color: theme.colors.text }]}>{category?.name ?? 'Unknown'}</Text>
                  <Text style={[styles.recentSubtitle, { color: theme.colors.subtitle }]}>{formatDateTime(txn.timestamp, 'LLL')}</Text>
                </View>
                <Text style={[styles.recentAmount, { color: isExpense ? theme.colors.danger : theme.colors.success }]}>
                  {`${isExpense ? '-' : '+'}${formatCurrency(txn.amountCents).replace(/^[+-]/, '')}`}
                </Text>
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
};

type MetricCardProps = {
  title: string;
  value: string;
  caption?: string;
  tone: string;
  fullWidth?: boolean;
  surfaceColor?: string;
  borderColor?: string;
  titleColor?: string;
  captionColor?: string;
};

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  caption,
  tone,
  fullWidth = false,
  surfaceColor,
  borderColor,
  titleColor,
  captionColor,
}) => (
  <View
    style={[
      styles.metricCard,
      fullWidth && styles.metricCardFullWidth,
      surfaceColor ? { backgroundColor: surfaceColor } : null,
      borderColor ? { borderColor } : null,
    ]}
  >
    <Text style={[styles.metricTitle, titleColor ? { color: titleColor } : null]}>{title}</Text>
    <Text style={[styles.metricValue, { color: tone }]}>{value}</Text>
    {caption ? (
      <Text style={[styles.metricCaption, captionColor ? { color: captionColor } : null]}>{caption}</Text>
    ) : null}
  </View>
);

type CategoryRowProps = {
  name: string;
  icon: string;
  amount: string;
  percentage: number;
  tone: string;
  textColor?: string;
};

const CategoryRow: React.FC<CategoryRowProps> = ({ name, icon, amount, percentage, tone, textColor }) => (
  <View style={styles.categoryRow}>
    <View style={styles.categoryIconWrapper}>
      <Ionicons name={icon as React.ComponentProps<typeof Ionicons>['name']} size={20} color={tone} />
    </View>
    <View style={styles.categoryContent}>
      <View style={styles.categoryHeader}>
        <Text style={[styles.categoryName, { color: textColor }]}>{name}</Text>
        <Text style={[styles.categoryAmount, { color: textColor }]}>{amount}</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.max(percentage * 100, 4)}%`, backgroundColor: tone }]} />
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  period: {
    fontSize: 14,
    marginBottom: 16,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardWrapper: {
    flex: 1,
  },
  cardWrapperRight: {
    marginRight: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E2E8F0',
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  metricCaption: {
    fontSize: 12,
    color: '#64748B',
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    marginRight: 12,
  },
  categoryContent: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  recentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recentSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  recentAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default DashboardScreen;
