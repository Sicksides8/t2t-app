import React from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '../../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, placeholderTextColor = Colors.textTertiary, ...props }: InputProps) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        placeholderTextColor={placeholderTextColor}
        selectionColor={Colors.accentPrimary}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.sm,
  },
  label: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  input: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: Colors.divider,
    borderRadius: Radius.card,
    backgroundColor: Colors.glass,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    ...Typography.body,
  },
  inputError: {
    borderColor: Colors.error,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
  },
});
