import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CardGlass } from '../ui';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  label: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
};

/** Tarjeta glass para grids de hooks 36–37, 46. */
export function HookSelectCard({ label, subtitle, icon, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <CardGlass style={selected ? styles.cardActive : styles.card}>
        <View style={styles.row}>
          {icon ? (
            <Ionicons name={icon} size={20} color={selected ? Colors.accentPrimary : Colors.textSecondary} />
          ) : null}
          <View style={styles.col}>
            <Text style={styles.label}>{label}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {selected ? <Ionicons name="checkmark-circle" size={22} color={Colors.accentHighlight} /> : null}
        </View>
      </CardGlass>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { marginBottom: Spacing.sm },
  pressed: { opacity: 0.88 },
  card: { padding: Spacing.md },
  cardActive: {
    padding: Spacing.md,
    borderColor: Colors.accentPrimary,
    borderWidth: 1,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  col: { flex: 1, gap: 2 },
  label: { ...Typography.body, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { ...Typography.caption, color: Colors.textSecondary },
});
