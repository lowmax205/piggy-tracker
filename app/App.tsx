import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { RealmProvider } from './db/RealmProvider';
import { RootNavigator } from './navigation/RootNavigator';
import { ThemeProvider, useTheme } from './state/theme';
import { AppStoreProvider, useAppStore } from './state/store';
import { FAB } from './components/FAB';
import { TransactionModal } from './components/TransactionModal';
import { SyncProvider } from './components/SyncProvider';
import { measureColdStart, measureDashboardReady } from './lib/perf';

// Mark app start time
measureColdStart();

const NavigationHost = () => {
  const { navigationTheme, statusBarStyle } = useTheme();
  const [currentRoute, setCurrentRoute] = useState('Dashboard');

  useEffect(() => {
    // Measure dashboard ready time on first render
    const timer = setTimeout(() => {
      if (currentRoute === 'Dashboard') {
        measureDashboardReady();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContainer 
      theme={navigationTheme}
      onStateChange={(state) => {
        if (state) {
          const route = state.routes[state.index];
          setCurrentRoute(route.name);
        }
      }}
    >
      <StatusBar style={statusBarStyle} />
      <RootNavigator />
      <GlobalOverlay currentRoute={currentRoute} />
    </NavigationContainer>
  );
};

const GlobalOverlay = ({ currentRoute }: { currentRoute: string }) => {
  const { openTransactionModal } = useAppStore();
  const showFAB = currentRoute === 'Dashboard' || currentRoute === 'History';
  
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <TransactionModal />
      {showFAB && <FAB onPress={() => openTransactionModal('create')} />}
    </View>
  );
};

const AppInner = () => (
  <ThemeProvider>
    <AppStoreProvider>
      <SyncProvider>
        <NavigationHost />
      </SyncProvider>
    </AppStoreProvider>
  </ThemeProvider>
);

const AppRoot = () => (
  <SafeAreaProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RealmProvider>
        <AppInner />
      </RealmProvider>
    </GestureHandlerRootView>
  </SafeAreaProvider>
);

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
export default function App() {
  return <AppRoot />;
}
