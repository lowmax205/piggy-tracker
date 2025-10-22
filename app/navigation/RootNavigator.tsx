import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { RouteProp } from '@react-navigation/native';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { AccountNavigator } from './AccountNavigator';

export type RootTabParamList = {
  Dashboard: undefined;
  History: undefined;
  Account: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const ICONS: Record<keyof RootTabParamList, React.ComponentProps<typeof Ionicons>['name']> = {
  Dashboard: 'speedometer-outline',
  History: 'time-outline',
  Account: 'person-circle-outline',
};

type ScreenOptionsArg = {
  route: RouteProp<RootTabParamList, keyof RootTabParamList>;
};

export const RootNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }: ScreenOptionsArg) => {
        const routeName = getFocusedRouteNameFromRoute(route);
        const shouldHideTabBar = routeName === 'ManageCategories' || routeName === 'Auth' || routeName === 'Settings' || routeName === 'Feedback';
        
        return {
          headerShown: false,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => {
            const iconName = ICONS[route.name as keyof RootTabParamList];
            return <Ionicons name={iconName} color={color} size={size} />;
          },
          tabBarStyle: shouldHideTabBar 
            ? { display: 'none' }
            : {
                paddingBottom: insets.bottom + 8,
                height: 60 + insets.bottom,
              },
        };
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Account" component={AccountNavigator} />
    </Tab.Navigator>
  );
};
