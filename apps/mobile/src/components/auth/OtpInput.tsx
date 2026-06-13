import React, { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Colors } from '../../theme';

type Props = {
  value: string;
  onChange: (code: string) => void;
  length?: number;
};

/** Penpot 39 — 6 celdas OTP. La celda activa se resalta con borde magenta. */
export function OtpInput({ value, onChange, length = 6 }: Props) {
  const inputRef = useRef<TextInput>(null);
  const activeIndex = Math.min(value.length, length - 1);

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
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel="Código de verificación"
      >
        {Array.from({ length }).map((_, i) => {
          const digit = value[i] ?? '';
          const isFilled = digit !== '';
          const isActive = i === activeIndex && !isFilled;
          return (
            <View
              key={i}
              style={[
                styles.cell,
                isActive && styles.cellActive,
                isFilled && styles.cellFilled,
              ]}
            >
              <TextInput
                editable={false}
                value={digit}
                style={styles.cellText}
                pointerEvents="none"
              />
            </View>
          );
        })}
      </Pressable>
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
    height: 56,
    borderRadius: 14,
    backgroundColor: '#2A1052',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: {
    borderColor: Colors.accentPrimary,
    borderWidth: 1.5,
  },
  cellFilled: {
    borderColor: Colors.accentPrimary,
    backgroundColor: '#B73CEF26',
  },
  cellText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    padding: 0,
  },
});
