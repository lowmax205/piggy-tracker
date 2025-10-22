import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../state/theme';
import { useAuthService } from '../services/auth';
import { useSupabaseSync } from '../services/supabaseSync';
import { useRealm } from '../db/RealmProvider';
import { usePreferences } from '../db/repository';
import type { AccountStackParamList } from '../navigation/AccountNavigator';

const formatSyncTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const AccountScreen: React.FC = () => {
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const { theme, toggleTheme, mode } = useTheme();
  const { status, email, logout } = useAuthService();
  const { syncAll } = useSupabaseSync();
  const realm = useRealm();
  const { preferences, updatePreferences } = usePreferences();
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasInitialSynced, setHasInitialSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const isAuthenticated = status === 'authenticated';
  
  // Get last sync time from preferences (reactive to changes)
  const lastSyncTime = preferences?.lastSyncAt || null;

  useFocusEffect(
    React.useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const handleSync = useCallback(async (isInitialSync: boolean = false) => {
    setIsSyncing(true);
    setSyncError(null);

    // Get last sync time for incremental sync
    const lastSync = lastSyncTime || undefined;

    const result = await syncAll(isInitialSync, lastSync);
    setIsSyncing(false);

    if (result.success) {
      // Update last sync time in preferences
      updatePreferences({ lastSyncAt: new Date() });
    } else {
      setSyncError(result.error || 'Sync failed');
    }
  }, [lastSyncTime, syncAll, updatePreferences]);

  // Auto-sync on authentication (initial sync only)
  useEffect(() => {
    if (isAuthenticated && !hasInitialSynced) {
      handleSync(true); // Initial sync
      setHasInitialSynced(true);
    }
  }, [isAuthenticated, hasInitialSynced, handleSync]);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Do you want to keep your local data or clear it?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Keep Data',
          onPress: () => {
            logout();
          },
        },
        {
          text: 'Clear Data',
          style: 'destructive',
          onPress: () => {
            // Clear all local data
            realm.write(() => {
              realm.deleteAll();
            });
            logout();
          },
        },
      ]
    );
  };

  const handleManageCategories = () => {
    navigation.navigate('ManageCategories');
  };

  const handleSettings = () => {
    navigation.navigate('Settings');
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      // No-op: in MVP we silently ignore failures
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <ScrollView ref={scrollViewRef} contentContainerStyle={[styles.content, { paddingTop: insets.top, paddingBottom: 120 + insets.bottom }]}>
        {!isAuthenticated && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account</Text>
            <View style={[styles.promptCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <Ionicons name="cloud-upload-outline" size={40} color={theme.colors.primary} style={styles.promptIcon} />
              <Text style={[styles.promptTitle, { color: theme.colors.text }]}>Create a free account</Text>
              <Text style={[styles.promptSubtitle, { color: theme.colors.subtitle }]}>
                Back up your data and sync across devices
              </Text>
              <Pressable
                style={[styles.promptButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate('Auth')}
                accessibilityRole="button"
              >
                <Text style={styles.promptButtonLabel}>Sign Up or Log In</Text>
              </Pressable>
            </View>
          </View>
        )}

        {isAuthenticated && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Account</Text>
            <View style={[styles.authInfoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={styles.authInfoRow}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} style={styles.authIcon} />
                <View style={styles.authTextBlock}>
                  <Text style={[styles.authLabel, { color: theme.colors.subtitle }]}>Logged in as</Text>
                  <Text style={[styles.authEmail, { color: theme.colors.text }]}>{email}</Text>
                </View>
              </View>
              
              {/* Sync Status */}
              <View style={styles.syncStatusContainer}>
                {lastSyncTime && (
                  <View style={styles.syncStatusRow}>
                    <Ionicons name="cloud-done" size={16} color={theme.colors.success} />
                    <Text style={[styles.syncStatusText, { color: theme.colors.text }]}>
                      Last synced: {formatSyncTime(lastSyncTime)}
                    </Text>
                  </View>
                )}
                {!lastSyncTime && !syncError && (
                  <View style={styles.syncStatusRow}>
                    <Ionicons name="cloud-outline" size={16} color={theme.colors.subtitle} />
                    <Text style={[styles.syncStatusText, { color: theme.colors.text }]}>Not synced yet</Text>
                  </View>
                )}
                {syncError && (
                  <View style={styles.syncStatusRow}>
                    <Ionicons name="cloud-offline" size={16} color={theme.colors.danger} />
                    <Text style={[styles.syncErrorText, { color: theme.colors.danger }]}>
                      {syncError}
                    </Text>
                  </View>
                )}
              </View>

              {/* Manual Sync Button */}
              <Pressable
                style={[styles.syncButton, { backgroundColor: theme.colors.primary, opacity: isSyncing ? 0.6 : 1 }]}
                onPress={() => handleSync(false)} 
                disabled={isSyncing}
                accessibilityRole="button"
              >
                {isSyncing ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="sync" size={18} color="#fff" style={styles.syncButtonIcon} />
                )}
                <Text style={styles.syncButtonLabel}>
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.logoutButton, { borderColor: theme.colors.border }]}
                onPress={handleLogout}
                accessibilityRole="button"
              >
                <Text style={[styles.logoutLabel, { color: theme.colors.danger }]}>Log Out</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>General</Text>
          <Pressable
            style={[styles.row, { borderColor: theme.colors.border }]}
            onPress={handleManageCategories}
            accessibilityRole="button"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="albums-outline" size={22} color={theme.colors.primary} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Manage Categories</Text>
                <Text style={[styles.rowSubtitle, { color: theme.colors.subtitle }]}>Add, rename, and delete categories</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtitle} />
          </Pressable>

          <Pressable
            style={[styles.row, { borderColor: theme.colors.border }]}
            onPress={handleSettings}
            accessibilityRole="button"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="settings-outline" size={22} color={theme.colors.primary} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Settings</Text>
                <Text style={[styles.rowSubtitle, { color: theme.colors.subtitle }]}>Currency, data management, and more</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtitle} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Appearance</Text>
          <View
            style={[styles.row, { borderColor: theme.colors.border }]}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="color-palette-outline" size={22} color={theme.colors.primary} style={styles.rowIcon} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Theme</Text>
                <Text style={[styles.rowSubtitle, { color: theme.colors.subtitle }]}>{mode === 'dark' ? 'Dark' : 'Light'} Mode</Text>
              </View>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: theme.colors.primary }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Support</Text>
          <Pressable
            style={[styles.row, { borderColor: theme.colors.border }]}
            onPress={() => setShowAboutModal(true)}
            accessibilityRole="button"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="information-circle-outline" size={22} color={theme.colors.primary} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>About</Text>
                <Text style={[styles.rowSubtitle, { color: theme.colors.subtitle }]}>Learn about the app and developer</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtitle} />
          </Pressable>

          <Pressable
            style={[styles.row, { borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate('Feedback')}
            accessibilityRole="button"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="chatbubble-ellipses-outline" size={22} color={theme.colors.primary} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Send Feedback</Text>
                <Text style={[styles.rowSubtitle, { color: theme.colors.subtitle }]}>Report bugs or request features</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.subtitle} />
          </Pressable>

          <Pressable
            style={[styles.row, { borderColor: theme.colors.border }]}
            onPress={() => handleOpenLink('https://example.com/rate')}
            accessibilityRole="button"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="star-outline" size={22} color={theme.colors.primary} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Rate this App</Text>
                <Text style={[styles.rowSubtitle, { color: theme.colors.subtitle }]}>Leave a quick review</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={20} color={theme.colors.subtitle} />
          </Pressable>

          <Pressable
            style={[styles.row, { borderColor: theme.colors.border }]}
            onPress={() => handleOpenLink('https://example.com/privacy')}
            accessibilityRole="button"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.primary} style={styles.rowIcon} />
              <View>
                <Text style={[styles.rowTitle, { color: theme.colors.text }]}>Privacy Policy</Text>
                <Text style={[styles.rowSubtitle, { color: theme.colors.subtitle }]}>Understand how data is handled</Text>
              </View>
            </View>
            <Ionicons name="open-outline" size={20} color={theme.colors.subtitle} />
          </Pressable>
        </View>
      </ScrollView>

      {/* About Modal */}
      <Modal
        visible={showAboutModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowAboutModal(false)}>
            <View />
          </Pressable>
          <View style={[styles.aboutModal, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.aboutHeader}>
              <Ionicons name="happy-outline" size={48} color={theme.colors.primary} />
            </View>
            <ScrollView 
              style={styles.aboutScrollView}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              <Text style={[styles.aboutTitle, { color: theme.colors.text }]}>Hey There! 👋</Text>
              <Text style={[styles.aboutText, { color: theme.colors.text }]}>
                So you&apos;re probably wondering why I built this budget app when there are literally thousands of them on the Play Store, right? 😅
              </Text>
              <Text style={[styles.aboutText, { color: theme.colors.text }]}>
                Here&apos;s the deal: I wanted to track my money without all those annoying ads, pushy subscriptions, or those &quot;just pay once!&quot; popups that won&apos;t leave you alone. Like, why is budgeting so expensive? 💀
              </Text>
              <Text style={[styles.aboutText, { color: theme.colors.text }]}>
                This whole thing started as a side project—basically me trying to vibe with some code and solve my own problems. And honestly? It&apos;s been lowkey fun building it! 💻✨
              </Text>
              <Text style={[styles.aboutText, { color: theme.colors.text }]}>
                <Text style={{ fontWeight: '700' }}>No cap: no ads, no subscriptions, no payments.</Text> Just a simple app I made because I wanted something better. If it helps you manage your money too, that&apos;s great! 🔥
              </Text>
              <Text style={[styles.aboutText, { color: theme.colors.text }]}>
                <Text style={{ fontWeight: '700' }}>Heads up:</Text> This app is currently in the development phase, so features are pretty limited for now. But don&apos;t worry—I&apos;m actively working on improvements and new features to make it even better!
              </Text>
              <Text style={[styles.aboutText, { color: theme.colors.text }]}>
                Found a bug or got ideas? Hit that feedback button! I actually read every message, no cap. Your feedback slaps and helps make this app better. 💬
              </Text>
              <Text style={[styles.aboutText, { color: theme.colors.text }]}>
                If you&apos;re vibing with this app and want to support the dev, you can send me some coffee money! ☕✨ No pressure tho—seriously, just knowing you&apos;re using it makes me happy. But if you&apos;re feeling generous:{' '}
                <Text 
                  style={{ fontWeight: '700', color: theme.colors.primary, textDecorationLine: 'underline' }}
                  onPress={() => handleOpenLink('https://paypal.me/NiloJrOlang')}
                >
                  paypal.me/NiloJrOlang
                </Text>
              </Text>
              <Text style={[styles.aboutSignature, { color: theme.colors.subtitle }]}>
                – Made with ☕ and way too much caffeine
              </Text>
            </ScrollView>
            <Pressable
              style={[styles.aboutCloseButton, { backgroundColor: theme.colors.primary }]}
              onPress={() => setShowAboutModal(false)}
            >
              <Text style={styles.aboutCloseText}>Got it! 👍</Text>
            </Pressable>
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
  promptCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 24,
    alignItems: 'center',
  },
  promptIcon: {
    marginBottom: 16,
  },
  promptTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  promptSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  promptButton: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  promptButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  authInfoCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
  },
  authInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authIcon: {
    marginRight: 12,
  },
  authTextBlock: {
    flex: 1,
  },
  authLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  authEmail: {
    fontSize: 16,
    fontWeight: '600',
  },
  syncStatusContainer: {
    marginTop: 8,
    marginBottom: 12,
    minHeight: 16,
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  syncStatusText: {
    fontSize: 13,
  },
  syncErrorText: {
    fontSize: 13,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  syncButtonIcon: {
    marginRight: 6,
  },
  syncButtonLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  verifyButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  logoutButton: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  logoutLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 24,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  aboutModal: {
    borderRadius: 24,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    maxHeight: '80%',
  },
  aboutHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  aboutScrollView: {
    maxHeight: '100%',
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  aboutText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  aboutSignature: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  aboutCloseButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  aboutCloseText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccountScreen;
