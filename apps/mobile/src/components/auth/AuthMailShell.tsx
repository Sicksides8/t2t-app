import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PenpotFlowShell } from '../penpot';
import { Button } from '../ui';
import { Colors, Spacing, Typography } from '../../theme';

export type AuthMailVariant = 'purple' | 'teal';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  variant?: AuthMailVariant;
  /** Override del ícono central (default: 'mail'). */
  icon?: keyof typeof import('@expo/vector-icons/build/Icons').Ionicons.glyphMap;
  children: React.ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
};

/** Penpot 33/38/39: tile mail con glow centrado + título + form + CTA. */
export function AuthMailShell({
  title,
  subtitle,
  onBack,
  variant = 'purple',
  icon = 'mail',
  children,
  primaryLabel,
  onPrimary,
  primaryLoading,
  primaryDisabled,
}: Props) {
  return (
    <PenpotFlowShell
      orbVariant="auth"
      contentStyle={styles.content}
      footer={
        <Button
          title={primaryLabel}
          onPress={onPrimary}
          loading={primaryLoading}
          disabled={primaryDisabled}
        />
      }
    >
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </Pressable>
      ) : null}

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <MailTile variant={variant} icon={icon} />

        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.form}>{children}</View>
      </ScrollView>
    </PenpotFlowShell>
  );
}

function MailTile({
  variant,
  icon,
}: {
  variant: AuthMailVariant;
  icon: keyof typeof import('@expo/vector-icons/build/Icons').Ionicons.glyphMap;
}) {
  const isTeal = variant === 'teal';
  const glowColor = isTeal ? '#34D6C2' : Colors.accentPrimary;
  const gradient = isTeal
    ? (['#0F4A4A', '#1F8F8F', '#34D6C2'] as const)
    : ([Colors.bgSurface, '#5B22A6', Colors.accentPrimary] as const);

  return (
    <View style={styles.tileWrap} pointerEvents="none">
      <View style={[styles.glowFar, { backgroundColor: `${glowColor}1A` }]} />
      <View style={[styles.glowOuter, { backgroundColor: `${glowColor}33` }]} />
      <View style={[styles.glowInner, { backgroundColor: `${glowColor}55` }]} />
      <LinearGradient
        colors={gradient}
        start={{ x: 0.15, y: 0.1 }}
        end={{ x: 0.9, y: 0.95 }}
        style={styles.tile}
      >
        <Ionicons name={icon} size={48} color={Colors.textPrimary} />
        {isTeal ? (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={12} color={Colors.textPrimary} />
          </View>
        ) : null}
      </LinearGradient>
    </View>
  );
}

const TILE = 104;

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: 0,
    paddingHorizontal: 0,
  },
  backBtn: {
    marginLeft: 20,
    marginTop: Spacing.sm,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  tileWrap: {
    width: TILE,
    height: TILE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  glowFar: {
    position: 'absolute',
    width: TILE * 2.4,
    height: TILE * 2.4,
    borderRadius: TILE * 1.2,
  },
  glowOuter: {
    position: 'absolute',
    width: TILE * 1.85,
    height: TILE * 1.85,
    borderRadius: TILE,
  },
  glowInner: {
    position: 'absolute',
    width: TILE * 1.35,
    height: TILE * 1.35,
    borderRadius: TILE,
  },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#34D6C2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.textPrimary,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  title: {
    ...Typography.h1,
    fontSize: 26,
    lineHeight: 32,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  form: {
    alignSelf: 'stretch',
    gap: Spacing.lg,
    marginTop: Spacing.xl,
  },
});
