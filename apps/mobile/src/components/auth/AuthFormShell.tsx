import React, { createContext, useCallback, useContext, useRef } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T2TLogo } from '../../assets/brand';
import { PenpotFlowShell } from '../penpot';
import { Button } from '../ui';
import { Colors, Spacing, Typography } from '../../theme';

type AuthScrollApi = {
  registerField: (key: string, node: View | null) => void;
  scrollToField: (key: string) => void;
};

const AuthScrollContext = createContext<AuthScrollApi | null>(null);

export function useAuthScroll(): AuthScrollApi | null {
  return useContext(AuthScrollContext);
}

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
  const scrollRef = useRef<ScrollView>(null);
  const scrollContentRef = useRef<View>(null);
  const fieldNodes = useRef<Map<string, View>>(new Map());

  const registerField = useCallback((key: string, node: View | null) => {
    if (node) fieldNodes.current.set(key, node);
    else fieldNodes.current.delete(key);
  }, []);

  const scrollToField = useCallback((key: string) => {
    const field = fieldNodes.current.get(key);
    const content = scrollContentRef.current;
    if (!field || !content || !scrollRef.current) return;

    field.measureInWindow((_fx, fy) => {
      content.measureInWindow((_cx, cy) => {
        const yInContent = fy - cy;
        scrollRef.current?.scrollTo({
          y: Math.max(0, yInContent - 24),
          animated: true,
        });
      });
    });
  }, []);

  const scrollApi = useRef<AuthScrollApi>({ registerField, scrollToField }).current;
  scrollApi.registerField = registerField;
  scrollApi.scrollToField = scrollToField;

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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {onBack ? (
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </Pressable>
        ) : null}

        <AuthScrollContext.Provider value={scrollApi}>
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View ref={scrollContentRef} collapsable={false}>
              <Image
                source={T2TLogo}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="T2T Academy"
              />

              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>
              <View style={styles.form}>{children}</View>
            </View>
          </ScrollView>
        </AuthScrollContext.Provider>
      </KeyboardAvoidingView>
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    paddingBottom: Spacing.xl + 48,
  },
  logo: {
    width: 72,
    height: 72,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
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
