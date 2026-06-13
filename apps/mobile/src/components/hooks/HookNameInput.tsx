import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors, Typography } from '../../theme';

type Props = {
  preScript: string;
  title: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  caption?: string;
};

export function HookNameInput({ preScript, title, value, onChangeText, placeholder, caption }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.script}>{preScript}</Text>
      <Text style={styles.title}>{title}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder || 'Tu nombre'}
        placeholderTextColor={Colors.textTertiary}
        autoCapitalize="words"
        autoCorrect={false}
        selectionColor={Colors.accentPrimary}
        style={[styles.input, focused && styles.inputFocused]}
      />
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
    paddingTop: 24,
  },
  script: {
    fontFamily: 'DreamingOutloud',
    color: Colors.accentHighlight,
    fontSize: 24,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 26,
    lineHeight: 32,
  },
  input: {
    marginTop: 12,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 16,
    backgroundColor: '#2A1052',
    borderWidth: 1.5,
    borderColor: '#FFFFFF14',
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  inputFocused: {
    borderColor: Colors.accentPrimary,
  },
  caption: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 6,
  },
});
