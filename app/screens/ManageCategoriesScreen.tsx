import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/theme';
import { useCategoriesService } from '../services/categories';
import type { CategoryIconName } from '../components/TransactionListItem';

const ICON_CHOICES: CategoryIconName[] = [
  'fast-food-outline',
  'cafe-outline',
  'bus-outline',
  'bicycle-outline',
  'car-outline',
  'game-controller-outline',
  'book-outline',
  'cart-outline',
  'ticket-outline',
  'fitness-outline',
  'medkit-outline',
  'shirt-outline',
  'cash-outline',
  'gift-outline',
  'phone-portrait-outline',
  'home-outline',
  'airplane-outline',
  'color-palette-outline',
  'sparkles-outline',
  'restaurant-outline',
];

const FALLBACK_ICON: CategoryIconName = 'apps-outline';

type CategoryItem = {
  id: string;
  name: string;
  icon: CategoryIconName;
  count: number;
  userDefined: boolean;
};

const ManageCategoriesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { categories, addCategory, renameCategory, removeCategory, getTransactionCount } = useCategoriesService();

  const [isAddModalVisible, setAddModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<CategoryIconName>(ICON_CHOICES[0]);
  const [formError, setFormError] = useState<string | null>(null);

  const [renameState, setRenameState] = useState<{ id: string; name: string } | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);

  const [deleteState, setDeleteState] = useState<{ id: string; name: string; count: number } | null>(null);
  const [replacementId, setReplacementId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const categoryItems = useMemo<CategoryItem[]>(
    () =>
      Array.from(categories)
        .map((category) => ({
          id: category.id,
          name: category.name,
          icon: (category.icon as CategoryIconName) ?? FALLBACK_ICON,
          count: getTransactionCount(category.id),
          userDefined: category.userDefined,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [categories, getTransactionCount],
  );

  const availableReplacementOptions = useMemo(
    () =>
      deleteState
        ? categoryItems.filter((item) => item.id !== deleteState.id)
        : [],
    [categoryItems, deleteState],
  );

  const resetAddForm = () => {
    setNewCategoryName('');
    setNewCategoryIcon(ICON_CHOICES[0]);
    setFormError(null);
  };

  const openAddModal = () => {
    resetAddForm();
    setAddModalVisible(true);
  };

  const handleCreateCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      setFormError('Name is required');
      return;
    }
    addCategory(trimmed, newCategoryIcon);
    setAddModalVisible(false);
  };

  const openRenameModal = (item: CategoryItem) => {
    setRenameState({ id: item.id, name: item.name });
    setRenameError(null);
  };

  const handleRenameCategory = () => {
    if (!renameState) {
      return;
    }
    const trimmed = renameState.name.trim();
    if (!trimmed) {
      setRenameError('Name is required');
      return;
    }
    renameCategory(renameState.id, trimmed);
    setRenameState(null);
  };

  const handleDeleteCategory = (item: CategoryItem) => {
    if (item.count === 0) {
      Alert.alert(
        'Delete category',
        `Delete "${item.name}"? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => removeCategory(item.id),
          },
        ],
      );
      return;
    }
    setDeleteState({ id: item.id, name: item.name, count: item.count });
    setReplacementId(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = () => {
    if (!deleteState) {
      return;
    }
    if (deleteState.count > 0 && !replacementId) {
      setDeleteError('Select a replacement category');
      return;
    }
    removeCategory(deleteState.id, replacementId ?? undefined);
    setDeleteState(null);
    setReplacementId(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Categories</Text>
        <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>
          Customize the categories used when logging transactions.
        </Text>
        <Pressable
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={openAddModal}
          accessibilityRole="button"
        >
          <Ionicons name="add" size={20} color="#fff" style={styles.addButtonIcon} />
          <Text style={styles.addButtonLabel}>Add Category</Text>
        </Pressable>
      </View>

      <FlatList
        data={categoryItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(120, 120 + insets.bottom) }]}
        renderItem={({ item }) => (
          <View style={[styles.categoryRow, { borderColor: theme.colors.border }]}> 
            <View style={styles.categoryLeft}>
              <View style={[styles.iconWrapper, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}> 
                <Ionicons name={item.icon} size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={[styles.categoryName, { color: theme.colors.text }]}>{item.name}</Text>
                <Text style={[styles.categoryMeta, { color: theme.colors.subtitle }]}>
                  {item.count === 1 ? '1 transaction' : `${item.count} transactions`}
                </Text>
              </View>
            </View>
            <View style={styles.actions}>
              <Pressable
                onPress={() => openRenameModal(item)}
                style={({ pressed }) => [styles.actionButton, pressed ? { opacity: 0.6 } : null]}
                accessibilityRole="button"
                accessibilityLabel={`Rename ${item.name}`}
              >
                <Ionicons name="create-outline" size={18} color={theme.colors.subtitle} />
              </Pressable>
              <Pressable
                onPress={() => handleDeleteCategory(item)}
                style={({ pressed }) => [styles.actionButton, pressed ? { opacity: 0.6 } : null]}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.name}`}
              >
                <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.colors.subtitle }]}>
              No categories available. Add your first category to get started.
            </Text>
          </View>
        }
      />

      <Modal visible={isAddModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Add Category</Text>
            <Text style={[styles.modalHelper, { color: theme.colors.subtitle }]}>Name</Text>
            <TextInput
              value={newCategoryName}
              onChangeText={(text) => {
                setNewCategoryName(text);
                setFormError(null);
              }}
              placeholder="e.g. Textbooks"
              placeholderTextColor={theme.colors.subtitle}
              style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
              autoFocus
            />
            <Text style={[styles.modalHelper, { color: theme.colors.subtitle }]}>Icon</Text>
            <ScrollView horizontal contentContainerStyle={styles.iconChoices} showsHorizontalScrollIndicator={false}>
              {ICON_CHOICES.map((icon) => {
                const selected = icon === newCategoryIcon;
                return (
                  <Pressable
                    key={icon}
                    style={[styles.iconChoice, selected ? { backgroundColor: theme.colors.primary } : { borderColor: theme.colors.border }]}
                    onPress={() => setNewCategoryIcon(icon)}
                  >
                    <Ionicons name={icon} size={24} color={selected ? '#fff' : theme.colors.primary} />
                  </Pressable>
                );
              })}
            </ScrollView>
            {formError ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>{formError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setAddModalVisible(false)} style={styles.modalSecondaryButton}>
                <Text style={[styles.modalSecondaryLabel, { color: theme.colors.subtitle }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateCategory}
                style={[styles.modalPrimaryButton, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={styles.modalPrimaryLabel}>Create</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={renameState !== null} transparent animationType="fade" onRequestClose={() => setRenameState(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Rename Category</Text>
            <TextInput
              value={renameState?.name ?? ''}
              onChangeText={(text) => {
                if (renameState) {
                  setRenameState({ ...renameState, name: text });
                }
                setRenameError(null);
              }}
              placeholder="Category name"
              placeholderTextColor={theme.colors.subtitle}
              style={[styles.textInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
              autoFocus
            />
            {renameError ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>{renameError}</Text> : null}
            <View style={styles.modalActions}>
              <Pressable onPress={() => setRenameState(null)} style={styles.modalSecondaryButton}>
                <Text style={[styles.modalSecondaryLabel, { color: theme.colors.subtitle }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleRenameCategory}
                style={[styles.modalPrimaryButton, { backgroundColor: theme.colors.primary }]}
              >
                <Text style={styles.modalPrimaryLabel}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={deleteState !== null} transparent animationType="fade" onRequestClose={() => setDeleteState(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}> 
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Delete Category</Text>
            {deleteState ? (
              <>
                <Text style={[styles.modalBodyText, { color: theme.colors.text }]}>
                  {deleteState.count}{' '}
                  {deleteState.count === 1 ? 'transaction needs' : 'transactions need'} to be reassigned before deleting {deleteState.name}.
                </Text>
                <Text style={[styles.modalHelper, { color: theme.colors.subtitle }]}>Select replacement category</Text>
                <ScrollView style={styles.replacementList}>
                  {availableReplacementOptions.map((option) => {
                    const selected = option.id === replacementId;
                    return (
                      <Pressable
                        key={option.id}
                        onPress={() => setReplacementId(option.id)}
                        style={[styles.replacementRow, { borderColor: theme.colors.border, backgroundColor: selected ? theme.colors.primary : theme.colors.surface }]}
                      >
                        <View style={styles.replacementLeft}>
                          <Ionicons
                            name={option.icon}
                            size={20}
                            color={selected ? '#fff' : theme.colors.primary}
                            style={styles.replacementIcon}
                          />
                          <Text style={[styles.replacementLabel, { color: selected ? '#fff' : theme.colors.text }]}>{option.name}</Text>
                        </View>
                        <Text style={[styles.replacementCount, { color: selected ? '#fff' : theme.colors.subtitle }]}>
                          {option.count} tx
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {deleteError ? <Text style={[styles.errorText, { color: theme.colors.danger }]}>{deleteError}</Text> : null}
                <View style={styles.modalActions}>
                  <Pressable onPress={() => setDeleteState(null)} style={styles.modalSecondaryButton}>
                    <Text style={[styles.modalSecondaryLabel, { color: theme.colors.subtitle }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleConfirmDelete}
                    style={[styles.modalPrimaryButton, { backgroundColor: theme.colors.danger }]}
                  >
                    <Text style={styles.modalPrimaryLabel}>Reassign & Delete</Text>
                  </Pressable>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addButtonIcon: {
    marginRight: 8,
  },
  addButtonLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 24,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 16,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalHelper: {
    fontSize: 14,
    marginBottom: 6,
  },
  modalBodyText: {
    fontSize: 15,
    marginBottom: 12,
    lineHeight: 22,
  },
  textInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  iconChoices: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  iconChoice: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginRight: 12,
  },
  errorText: {
    marginTop: 4,
    marginBottom: 8,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  modalSecondaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  modalSecondaryLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalPrimaryButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginLeft: 12,
  },
  modalPrimaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  iconChoiceSelected: {},
  replacementList: {
    maxHeight: 200,
    marginVertical: 8,
  },
  replacementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  replacementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replacementIcon: {
    marginRight: 12,
  },
  replacementLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  replacementCount: {
    fontSize: 13,
  },
});

export default ManageCategoriesScreen;
