import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/theme';

type FABProps = {
  onPress: () => void;
  label?: string;
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  disabled?: boolean;
  testID?: string;
};

export const FAB: React.FC<FABProps> = ({
  onPress,
  label,
  iconName = 'add',
  disabled = false,
  testID = 'fab-primary',
}) => {
  const { theme } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || "Add transaction"}
      accessibilityHint="Opens form to log a new expense or income"
      accessibilityState={{ disabled }}
      testID={testID}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.root,
        label ? styles.rootWithLabel : styles.rootCircle,
        {
          backgroundColor: theme.colors.primary,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          shadowColor: theme.colors.primary,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons name={iconName} size={24} color="#fff" />
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    right: 24,
    bottom: 120,
    elevation: 4,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
  },
  rootCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  rootWithLabel: {
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
  },
});
