import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';
import type { HookChip } from '../../data/hooksFlow';

type Props = {
  chipMain: HookChip;
  chips: HookChip[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
};

export function HookChipGrid({ chipMain, chips, selectedIds, onToggle }: Props) {
  const mainSelected = selectedIds.has(chipMain.id);
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected: mainSelected }}
        onPress={() => onToggle(chipMain.id)}
        style={[styles.mainChip, mainSelected && styles.mainChipSelected]}
      >
        <Text style={styles.mainChipText}>{chipMain.label}</Text>
        {mainSelected ? (
          <Ionicons name="checkmark" size={18} color={Colors.accentHighlight} />
        ) : null}
      </Pressable>

      <View style={styles.grid}>
        {chips.map((chip) => {
          const selected = selectedIds.has(chip.id);
          return (
            <Pressable
              key={chip.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onToggle(chip.id)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={styles.chipText} numberOfLines={1}>
                {chip.label}
              </Text>
              {selected ? (
                <Ionicons name="checkmark" size={14} color={Colors.accentHighlight} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  mainChip: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#1F0A40CC',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mainChipSelected: {
    borderColor: Colors.accentPrimary,
    backgroundColor: '#2A1052',
  },
  mainChipText: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#1F0A40',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 50,
  },
  chipSelected: {
    borderColor: Colors.accentPrimary,
    backgroundColor: '#2A1052',
  },
  chipText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});
