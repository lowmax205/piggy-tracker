import React, { useState, useRef } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/theme';
import { CURRENCIES } from '../lib/format';
import { usePreferences } from '../db/repository';
import { useRealm } from '../db/RealmProvider';

const SettingsScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { preferences, updatePreferences } = usePreferences();
  const realm = useRealm();
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const currentCurrency = preferences?.currency || 'USD';
  const currentCurrencyConfig = CURRENCIES.find((c) => c.code === currentCurrency);

  const handleCurrencyChange = (currency: string) => {
    updatePreferences({ currency });
    setShowCurrencyPicker(false);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your transactions, categories, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: () => {
            try {
              realm.write(() => {
                realm.deleteAll();
              });
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              console.error('[SettingsScreen] Failed to clear data', error);
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView ref={scrollViewRef} contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: 120 + insets.bottom }]}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Preferences</Text>
          
          <Pressable
            style={[styles.row, { borderColor: theme.colors.border }]}
            onPress={() => setShowCurrencyPicker(true)}
            accessibilityRole="button"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="cash-outline" size={22} color={theme.colors.primary} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Currency</Text>
                <Text style={[styles.rowSubtitle, { color: theme.colors.subtitle }]}>
                  {currentCurrencyConfig?.symbol} {currentCurrencyConfig?.name}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtitle} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Data Management</Text>
          
          <Pressable
            style={[styles.row, { borderColor: theme.colors.border }]}
            onPress={handleClearData}
            accessibilityRole="button"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="trash-outline" size={22} color={theme.colors.danger} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: theme.colors.danger }]}>Clear All Data</Text>
                <Text style={[styles.rowSubtitle, { color: theme.colors.subtitle }]}>
                  Permanently delete all transactions and categories
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtitle} />
          </Pressable>
        </View>
      </ScrollView>

      {/* Currency Picker Modal */}
      <Modal
        visible={showCurrencyPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCurrencyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowCurrencyPicker(false)}>
            <View />
          </Pressable>
          <View style={[styles.modalSheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Currency</Text>
              <Pressable onPress={() => setShowCurrencyPicker(false)} accessibilityLabel="Close">
                <Ionicons name="close" size={24} color={theme.colors.subtitle} />
              </Pressable>
            </View>
            <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
              {CURRENCIES.map((currency) => {
                const isSelected = currency.code === currentCurrency;
                return (
                  <Pressable
                    key={currency.code}
                    style={[
                      styles.currencyItem,
                      { borderColor: theme.colors.border },
                      isSelected && { backgroundColor: `${theme.colors.primary}20` },
                    ]}
                    onPress={() => handleCurrencyChange(currency.code)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                  >
                    <View style={styles.currencyLeft}>
                      <Text style={[styles.currencySymbol, { color: theme.colors.text }]}>
                        {currency.symbol}
                      </Text>
                      <View>
                        <Text style={[styles.currencyName, { color: theme.colors.text }]}>
                          {currency.name}
                        </Text>
                        <Text style={[styles.currencyCode, { color: theme.colors.subtitle }]}>
                          {currency.code}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
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
  content: {
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rowIcon: {
    marginRight: 14,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  currencyList: {
    padding: 20,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    width: 50,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyCode: {
    fontSize: 13,
    marginTop: 2,
  },
});

export default SettingsScreen;
