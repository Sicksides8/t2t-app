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
    gap: 8,
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2A1052',
    borderWidth: 1.5,
    borderColor: '#FFFFFF14',
    color: Colors.textPrimary,
    fontSize: 15,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  readonly: {
    justifyContent: 'center',
    opacity: 0.7,
  },
  value: {
    fontSize: 15,
    color: Colors.textTertiary,
  },
});
