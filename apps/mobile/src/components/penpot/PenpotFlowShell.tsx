import React from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PenpotOrbVariant } from '../../data/penpotFrames';
import { Colors } from '../../theme';
import { AppBackground } from './AppBackground';

type Props = {
  children: React.ReactNode;
  orbVariant?: PenpotOrbVariant;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  header?: React.ReactNode;
  footer?: React.ReactNode;
};

/** Contenedor base para pantallas alineadas a Penpot (fondo + orbes + safe area). */
export function PenpotFlowShell({
  children,
  orbVariant = 'default',
  scroll = false,
  contentStyle,
  header,
  footer,
}: Props) {
  const body = (
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={styles.root}>
      <AppBackground variant={orbVariant} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {header ? <View style={styles.header}>{header}</View> : null}
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {body}
          </ScrollView>
        ) : (
          body
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
});
