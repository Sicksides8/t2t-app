import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBackground } from '../penpot/AppBackground';
import { TAB_BAR_OVERLAY_PADDING } from '../../navigation/tabBarConstants';
import { TAB_SCREEN_EDGES } from '../ui';
import { Colors, Spacing } from '../../theme';
import { ProfileSubScreenHeader } from './ProfileSubScreenHeader';

type Props = {
  title: string;
  onBack: () => void;
  rightLabel?: string;
  onRightPress?: () => void;
  footer?: React.ReactNode;
  contentStyle?: ViewStyle;
  children: React.ReactNode;
};

export function ProfileScreenShell({
  title,
  onBack,
  rightLabel,
  onRightPress,
  footer,
  contentStyle,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const scrollPadding = footer ? Spacing.lg : TAB_BAR_OVERLAY_PADDING + Spacing.lg;
  const footerPaddingBottom = TAB_BAR_OVERLAY_PADDING + insets.bottom + Spacing.lg;

  return (
    <View style={styles.root}>
      <AppBackground variant="default" />
      <SafeAreaView style={styles.safe} edges={TAB_SCREEN_EDGES}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.headerWrap}>
            <ProfileSubScreenHeader
              title={title}
              onBack={onBack}
              rightLabel={rightLabel}
              onRightPress={onRightPress}
            />
          </View>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: scrollPadding },
              contentStyle,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.body}>{children}</View>
          </ScrollView>
          {footer ? (
            <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>{footer}</View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerWrap: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
  },
  body: {
    gap: 12,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
  },
});
