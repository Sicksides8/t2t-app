import React from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PenpotOrbVariant } from '../../data/penpotFrames';
import { Colors } from '../../theme';
import { PenpotOrbs } from './PenpotOrbs';

type Props = {
  children: React.ReactNode;
  orbVariant?: PenpotOrbVariant;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  footer?: React.ReactNode;
};

/** Contenedor base para pantallas alineadas a Penpot (fondo + orbes + safe area). */
export function PenpotFlowShell({
  children,
  orbVariant = 'default',
  scroll = false,
  contentStyle,
  footer,
}: Props) {
  const body = (
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  );

  return (
    <View style={styles.root}>
      <PenpotOrbs variant={orbVariant} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
});
