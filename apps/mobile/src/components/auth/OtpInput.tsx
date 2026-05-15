import React, { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Colors } from '../../theme';

type Props = {
  value: string;
  onChange: (code: string) => void;
  length?: number;
};

/** Penpot 35 — 6 celdas OTP (verificación email vía polling tras completar). */
export function OtpInput({ value, onChange, length = 6 }: Props) {
  const inputRef = useRef<TextInput>(null);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  return (
    <View style={styles.wrap}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hidden}
        autoFocus
      />
      <View style={styles.row}>
        {digits.map((d, i) => (
          <View
            key={i}
            style={[styles.cell, d.trim() !== '' && styles.cellFilled]}
            onTouchEnd={() => inputRef.current?.focus()}
          >
            <TextInput
              editable={false}
              value={d.trim()}
              style={styles.cellText}
              pointerEvents="none"
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: 16,
  },
  hidden: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  cell: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellFilled: {
    borderColor: Colors.accentPrimary,
    backgroundColor: '#B73CEF33',
  },
  cellText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    padding: 0,
  },
});
