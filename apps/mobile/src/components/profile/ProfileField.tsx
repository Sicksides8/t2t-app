import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '../../theme';

type Props = {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  editable?: boolean;
  multiline?: boolean;
};

export function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  editable = true,
  multiline,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {editable && onChangeText ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          style={[styles.input, multiline && styles.multiline]}
          multiline={multiline}
          editable={editable}
          selectionColor={Colors.accentPrimary}
        />
      ) : (
        <View style={[styles.input, styles.readonly]}>
          <Text style={styles.value}>{value}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.bgSurface,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  multiline: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  readonly: {
    justifyContent: 'center',
  },
  value: {
    fontSize: 15,
    color: Colors.textTertiary,
  },
});
