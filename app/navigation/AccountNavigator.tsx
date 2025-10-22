import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AccountScreen from '../screens/AccountScreen';
import ManageCategoriesScreen from '../screens/ManageCategoriesScreen';
import AuthScreen from '../screens/AuthScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FeedbackScreen from '../screens/FeedbackScreen';

export type AccountStackParamList = {
  AccountHome: undefined;
  ManageCategories: undefined;
  Auth: undefined;
  Settings: undefined;
  Feedback: undefined;
};

const Stack = createNativeStackNavigator<AccountStackParamList>();

export const AccountNavigator: React.FC = () => (
  <Stack.Navigator>
    <Stack.Screen name="AccountHome" component={AccountScreen} options={{ headerShown: false }} />
    <Stack.Screen 
      name="ManageCategories" 
      component={ManageCategoriesScreen} 
      options={{ 
        title: 'Manage Categories',
        headerBackTitle: 'Back',
      }} 
    />
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen} 
      options={{ 
        title: 'Settings',
        headerBackTitle: 'Back',
      }} 
    />
    <Stack.Screen 
      name="Feedback" 
      component={FeedbackScreen} 
      options={{ 
        title: 'Send Feedback',
        headerBackTitle: 'Back',
      }} 
    />
    <Stack.Screen name="Auth" component={AuthScreen} options={{ title: 'Account', headerBackTitle: 'Back' }} />
  </Stack.Navigator>
);
