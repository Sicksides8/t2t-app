import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';
import type { HookIconOption } from '../../data/hooksFlow';

type Props = {
  options: HookIconOption[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
};

export function HookIconSelectList({ options, selectedIds, onToggle }: Props) {
  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const selected = selectedIds.has(opt.id);
        return (
          <Pressable
            key={opt.id}
            onPress={() => onToggle(opt.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.card,
              selected && styles.cardSelected,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.tile,
                { backgroundColor: opt.tileColor || Colors.glassStrong },
              ]}
            >
              <Ionicons name={opt.icon} size={22} color={opt.iconColor || Colors.textPrimary} />
            </View>
            <View style={styles.textCol}>
              <Text style={styles.label}>{opt.label}</Text>
              {opt.subtitle ? <Text style={styles.subtitle}>{opt.subtitle}</Text> : null}
            </View>
            <View style={selected ? styles.checkOn : styles.checkOff}>
              {selected ? <Ionicons name="checkmark" size={14} color={Colors.textPrimary} /> : null}
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
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#1F0A40CC',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
  },
  cardSelected: {
    borderColor: Colors.accentPrimary,
    borderWidth: 1.5,
    backgroundColor: '#2A1052',
  },
  pressed: {
    opacity: 0.9,
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
  },
  label: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
    fontSize: 12,
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
