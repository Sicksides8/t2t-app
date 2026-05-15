import React from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../theme';

/** Pantallas dentro del bottom tab (Android edge-to-edge): sin inset inferior duplicado. */
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
  const body = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, contentStyle]} showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, style]} edges={edges}>
      {gradient ? (
        <LinearGradient
          colors={[Colors.heroGradStart, Colors.heroGradMid, Colors.heroGradEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
});
