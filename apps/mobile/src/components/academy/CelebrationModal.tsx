import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../ui';
import { Colors, Radius, Spacing, Typography } from '../../theme';

export type CelebrationVariant = 'module' | 'course';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  coins?: number;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  onClose: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: CelebrationVariant;
};

/** Penpot 58 (module) / 59 (course) */
export function CelebrationModal({
  visible,
  title,
  body,
  coins,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
  icon,
  variant = 'course',
}: Props) {
  const resolvedIcon = icon ?? (variant === 'module' ? 'layers' : 'trophy');
  const gradient =
    variant === 'module'
      ? ([Colors.accentPrimary, Colors.bgSurface] as const)
      : ([Colors.accentHighlight, Colors.accentPrimary] as const);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <LinearGradient colors={gradient} style={styles.iconWrap}>
            <Ionicons name={resolvedIcon} size={48} color={Colors.textPrimary} />
          </LinearGradient>
          <Text style={styles.badge}>{variant === 'module' ? 'MÓDULO' : 'CURSO'}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          {coins != null && coins > 0 ? (
            <View style={styles.coinsRow}>
              <Ionicons name="logo-bitcoin" size={20} color={Colors.accentHighlight} />
              <Text style={styles.coins}>+{coins} T2T Coins</Text>
            </View>
          ) : null}
          <Button title={primaryLabel} onPress={onPrimary} />
          {secondaryLabel && onSecondary ? (
            <Button title={secondaryLabel} variant="ghost" onPress={onSecondary} />
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  card: {
    borderRadius: Radius.cardLg,
    padding: Spacing.xl,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: Spacing.md,
    alignItems: 'center',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: Colors.textTertiary,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  coins: {
    ...Typography.h2,
    color: Colors.accentHighlight,
    fontWeight: '800',
  },
});
