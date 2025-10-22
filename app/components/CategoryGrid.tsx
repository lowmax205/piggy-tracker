import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/theme';

export type CategoryGridItem = {
  id: string;
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

type CategoryGridProps = {
  categories: CategoryGridItem[];
  selectedId?: string;
  onSelect: (categoryId: string) => void;
  numColumns?: number;
};

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  selectedId,
  onSelect,
  numColumns = 3,
}) => {
  const { theme } = useTheme();

  const renderItem = ({ item, index }: { item: CategoryGridItem; index: number }) => {
    const isSelected = item.id === selectedId;
    const columnIndex = index % numColumns;
    const isLastRow = index >= categories.length - (categories.length % numColumns || numColumns);
    return (
      <Pressable
        onPress={() => onSelect(item.id)}
        accessibilityRole="button"
        accessibilityLabel={`${item.name} category`}
        accessibilityState={{ selected: isSelected }}
        accessibilityHint={isSelected ? "Currently selected" : "Select this category"}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
            borderColor: isSelected ? theme.colors.primary : theme.colors.border,
            opacity: pressed ? 0.85 : 1,
          },
          columnIndex < numColumns - 1 ? styles.cardSpacingHorizontal : undefined,
          !isLastRow ? styles.cardSpacingVertical : undefined,
        ]}
      >
        <View style={styles.iconWrapper}>
          <Ionicons
            name={item.icon}
            size={24}
            color={isSelected ? '#fff' : theme.colors.primary}
          />
        </View>
        <Text style={[styles.label, { color: isSelected ? '#fff' : theme.colors.text }]}>{item.name}</Text>
      </Pressable>
    );
  };

  return (
    <FlatList
      data={categories}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      scrollEnabled={false}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingBottom: 12,
  },
  card: {
    flex: 1,
    minHeight: 96,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  cardSpacingHorizontal: {
    marginRight: 12,
  },
  cardSpacingVertical: {
    marginBottom: 12,
  },
  iconWrapper: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
});
