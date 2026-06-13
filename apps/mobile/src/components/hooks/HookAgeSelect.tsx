import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';

type Props = {
  ranges: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function HookAgeSelect({ ranges, selectedId, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      {ranges.map((r) => {
        const selected = r === selectedId;
        return (
          <Pressable
            key={r}
            onPress={() => onSelect(r)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.option,
              selected && styles.optionSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.label}>{r}</Text>
            <View style={selected ? styles.checkOn : styles.checkOff}>
              {selected ? (
                <Ionicons name="checkmark" size={14} color={Colors.textPrimary} />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 999,
    backgroundColor: '#2A1052',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
  },
  optionSelected: {
    borderColor: Colors.accentPrimary,
    borderWidth: 1.5,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  checkOn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOff: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#FFFFFF33',
  },
});
