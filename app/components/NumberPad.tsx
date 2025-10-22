import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../state/theme';

type NumberPadKey = string;

type NumberPadProps = {
  onKeyPress: (key: NumberPadKey) => void;
  onSubmit?: () => void;
  submitLabel?: string;
  disabled?: boolean;
};

const layout: NumberPadKey[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '<'],
];

export const NumberPad: React.FC<NumberPadProps> = ({
  onKeyPress,
  onSubmit,
  submitLabel = 'Save',
  disabled = false,
}) => {
  const { theme } = useTheme();
  const buttonColor = useMemo(() => ({
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    textColor: theme.colors.text,
  }), [theme.colors.border, theme.colors.surface, theme.colors.text]);

  return (
    <View style={styles.wrapper}>
      <View>
        {layout.map((row, rowIndex) => (
          <View key={row.join('-')} style={[styles.row, rowIndex < layout.length - 1 && styles.rowSpacing]}>
            {row.map((key, keyIndex) => (
              <Pressable
                key={key}
                style={({ pressed }) => [
                  styles.key,
                  {
                    backgroundColor: buttonColor.backgroundColor,
                    borderColor: buttonColor.borderColor,
                    opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
                  },
                  keyIndex < row.length - 1 ? styles.keySpacing : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={key === '<' ? 'Backspace' : `Enter ${key}`}
                onPress={() => {
                  if (!disabled) {
                    onKeyPress(key);
                  }
                }}
              >
                {key === '<' ? (
                  <Ionicons name="backspace-outline" size={20} color={buttonColor.textColor} />
                ) : (
                  <Text style={[styles.keyText, { color: buttonColor.textColor }]}>{key}</Text>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>
      {onSubmit ? (
        <Pressable
          style={({ pressed }) => [
            styles.submit,
            {
              backgroundColor: theme.colors.primary,
              opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
          onPress={disabled ? undefined : onSubmit}
        >
          <Text style={styles.submitText}>{submitLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowSpacing: {
    marginBottom: 12,
  },
  key: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keySpacing: {
    marginRight: 12,
  },
  keyText: {
    fontSize: 22,
    fontWeight: '600',
  },
  submit: {
    marginTop: 24,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
