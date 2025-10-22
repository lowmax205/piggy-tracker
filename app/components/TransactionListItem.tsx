import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateTime } from '../lib/format';
import { useCurrency } from '../lib/useCurrency';
import { useTheme } from '../state/theme';

export type CategoryIconName = React.ComponentProps<typeof Ionicons>['name'];

export type TransactionListItemProps = {
  id: string;
  categoryName: string;
  categoryIcon: CategoryIconName;
  amountCents: number;
  type: 'expense' | 'income';
  timestamp: Date;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

const TransactionListItemComponent: React.FC<TransactionListItemProps> = ({
  id,
  categoryName,
  categoryIcon,
  amountCents,
  type,
  timestamp,
  onEdit,
  onDelete,
}) => {
  const { theme } = useTheme();
  const { formatCurrency } = useCurrency();
  const amountColor = type === 'expense' ? theme.colors.danger : theme.colors.success;
  const amountPrefix = type === 'expense' ? '-' : '+';

  return (
    <View style={[styles.container, { borderBottomColor: theme.colors.border }]}>
      <View style={styles.leftSection}>
        <View style={[styles.iconWrapper, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <Ionicons name={categoryIcon} size={20} color={theme.colors.primary} />
        </View>
        <View>
          <Text style={[styles.categoryName, { color: theme.colors.text }]}>{categoryName}</Text>
          <Text style={[styles.timestamp, { color: theme.colors.subtitle }]}>{formatDateTime(timestamp, 'LLL')}</Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {`${amountPrefix}${formatCurrency(amountCents).replace(/^[+-]/, '')}`}
        </Text>
        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => onEdit(id)}
            style={({ pressed }) => [styles.actionButton, pressed ? { opacity: 0.6 } : null]}
            accessibilityRole="button"
            accessibilityLabel="Edit transaction"
          >
            <Ionicons name="create-outline" size={18} color={theme.colors.subtitle} />
          </Pressable>
          <Pressable
            onPress={() => onDelete(id)}
            style={({ pressed }) => [styles.actionButton, pressed ? { opacity: 0.6 } : null]}
            accessibilityRole="button"
            accessibilityLabel="Delete transaction"
          >
            <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export const TransactionListItem = React.memo(TransactionListItemComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 13,
    marginTop: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
