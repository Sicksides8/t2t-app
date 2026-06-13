import React from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { AppBackground } from '../penpot/AppBackground';
import { TAB_BAR_OVERLAY_PADDING } from '../../navigation/tabBarConstants';
import { Colors, Spacing } from '../../theme';

/** Pantallas dentro del bottom tab: omitir el inset bottom porque el tab bar
 *  flotante ya cubre el safe area inferior. */
export const TAB_SCREEN_EDGES: Edge[] = ['top', 'left', 'right'];

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  gradient?: boolean;
  /** Omit bottom when la pantalla está sobre la tab bar (Android edge-to-edge). */
  edges?: Edge[];
}

export function ScreenWrapper({ children, scroll, style, contentStyle, gradient = true, edges }: ScreenWrapperProps) {
  const inTabs = edges === TAB_SCREEN_EDGES;
  const tabPaddingStyle: ViewStyle | null = inTabs
    ? { paddingBottom: TAB_BAR_OVERLAY_PADDING + Spacing.lg }
    : null;
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle, tabPaddingStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle, tabPaddingStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, style]}>
      {gradient ? <AppBackground variant="default" /> : null}
      <SafeAreaView style={styles.safe} edges={edges}>
        {body}
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
  content: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
});
