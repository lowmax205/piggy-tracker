import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../state/theme';
import { useAuthService } from '../services/auth';
import { useSupabaseSync } from '../services/supabaseSync';
import type { AccountStackParamList } from '../navigation/AccountNavigator';

type AuthMode = 'signup' | 'login';

const AuthScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AccountStackParamList>>();
  const { theme } = useTheme();
  const authService = useAuthService();
  const { signup, login, signInWithGoogle, status, lastError } = authService;
  const { syncAll } = useSupabaseSync();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isLoading = status === 'loading';

  // Navigate back to AccountHome when authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      navigation.navigate('AccountHome');
    }
  }, [status, navigation]);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      Alert.alert('Validation Error', 'Email is required');
      return;
    }

    if (!trimmedPassword) {
      Alert.alert('Validation Error', 'Password is required');
      return;
    }

    if (mode === 'signup') {
      if (trimmedPassword.length < 8) {
        Alert.alert('Validation Error', 'Password must be at least 8 characters');
        return;
      }
      if (trimmedPassword !== confirmPassword.trim()) {
        Alert.alert('Validation Error', 'Passwords do not match');
        return;
      }

      const success = await signup(trimmedEmail, trimmedPassword);
      if (success) {
        // Sync in background, navigation will happen via useEffect
        syncAll();
      } else if (lastError) {
        Alert.alert('Sign Up Failed', lastError);
      }
    } else {
      const success = await login(trimmedEmail, trimmedPassword);
      if (success) {
        // Sync in background, navigation will happen via useEffect
        syncAll();
      } else if (lastError) {
        Alert.alert('Login Failed', lastError);
      }
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'));
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: Math.max(insets.bottom, 40) }]} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {mode === 'signup' ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.subtitle }]}>
              {mode === 'signup'
                ? 'Back up and sync your transactions across devices'
                : 'Sign in to sync your data'}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Email</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.subtitle} style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={theme.colors.subtitle}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={[styles.input, { color: theme.colors.text }]}
                editable={!isLoading}
              />
            </View>

            <Text style={[styles.label, { color: theme.colors.text }]}>Password</Text>
            <View style={[styles.inputWrapper, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.subtitle} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Enter your password'}
                placeholderTextColor={theme.colors.subtitle}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, { color: theme.colors.text }]}
                editable={!isLoading}
              />
              <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeButton}>
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={theme.colors.subtitle}
                />
              </Pressable>
            </View>

            {mode === 'signup' && (
              <>
                <Text style={[styles.label, { color: theme.colors.text }]}>Confirm Password</Text>
                <View style={[styles.inputWrapper, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                  <Ionicons name="lock-closed-outline" size={20} color={theme.colors.subtitle} style={styles.inputIcon} />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter password"
                    placeholderTextColor={theme.colors.subtitle}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.input, { color: theme.colors.text }]}
                    editable={!isLoading}
                  />
                </View>
              </>
            )}

            <Pressable
              onPress={handleSubmit}
              style={[styles.submitButton, { backgroundColor: theme.colors.primary }]}
              disabled={isLoading}
            >
              <Text style={styles.submitLabel}>{isLoading ? 'Processing...' : mode === 'signup' ? 'Sign Up' : 'Log In'}</Text>
            </Pressable>

            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              <Text style={[styles.dividerText, { color: theme.colors.subtitle }]}>OR</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
            </View>

            <Pressable
              onPress={signInWithGoogle}
              style={[styles.googleButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
              disabled={isLoading}
            >
              <Ionicons name="logo-google" size={20} color="#EA4335" style={styles.googleIcon} />
              <Text style={[styles.googleLabel, { color: theme.colors.text }]}>Continue with Google</Text>
            </Pressable>

            <View style={styles.toggleRow}>
              <Text style={[styles.toggleText, { color: theme.colors.subtitle }]}>
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
              </Text>
              <Pressable onPress={toggleMode} disabled={isLoading}>
                <Text style={[styles.toggleLink, { color: theme.colors.primary }]}>
                  {mode === 'signup' ? 'Log In' : 'Sign Up'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  form: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 32,
  },
  submitLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  dividerText: {
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingVertical: 14,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  toggleText: {
    fontSize: 15,
    marginRight: 6,
  },
  toggleLink: {
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AuthScreen;
