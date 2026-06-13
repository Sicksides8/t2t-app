import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PenpotFlowShell } from '../penpot';
import { Button } from '../ui';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  footerLink?: { label: string; onPress: () => void };
};

/** Penpot 36_SignUp / 37_Login: back arrow + título left-aligned + form + CTA + link inferior. */
export function AuthFormShell({
  title,
  subtitle,
  onBack,
  children,
  primaryLabel,
  onPrimary,
  primaryLoading,
  primaryDisabled,
  footerLink,
}: Props) {
  return (
    <PenpotFlowShell
      orbVariant="auth"
      contentStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <Button
            title={primaryLabel}
            onPress={onPrimary}
            loading={primaryLoading}
            disabled={primaryDisabled}
          />
          {footerLink ? (
            <Pressable onPress={footerLink.onPress} style={styles.footerLinkWrap} hitSlop={8}>
              <Text style={styles.footerLink}>{footerLink.label}</Text>
            </Pressable>
          ) : null}
        </View>
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
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.form}>{children}</View>
      </ScrollView>
    </PenpotFlowShell>
  );
}

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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    fontSize: 32,
    lineHeight: 38,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  form: {
    gap: Spacing.lg,
  },
  footer: {
    gap: Spacing.sm,
  },
  footerLinkWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  footerLink: {
    ...Typography.bodyMedium,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
