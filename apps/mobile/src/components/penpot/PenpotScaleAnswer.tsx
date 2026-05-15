import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme';

type Props = {
  value?: number;
  onSelect: (value: number) => void;
};

const LABELS = ['1', '2', '3', '4', '5'];

/** Escala 1–5 alineada al artboard Components — T2T. */
export function PenpotScaleAnswer({ value, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.labels}>
        <Text style={styles.hint}>Nada cierto</Text>
        <Text style={styles.hint}>Totalmente cierto</Text>
      </View>
      <View style={styles.row}>
        {LABELS.map((label, i) => {
          const n = i + 1;
          const selected = value === n;
          return (
            <Pressable
              key={n}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onSelect(n)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    marginTop: 24,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hint: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  chip: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  chipSelected: {
    backgroundColor: '#B73CEF44',
    borderColor: Colors.accentPrimary,
  },
  chipText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.textPrimary,
  },
});
