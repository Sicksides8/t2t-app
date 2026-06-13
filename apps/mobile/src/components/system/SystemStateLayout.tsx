import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { PenpotFlowShell } from '../penpot';
import { Button } from '../ui';
import { Colors, Typography } from '../../theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  penpotFrame?: string;
  icon: IoniconName;
  glowColor: string;
  title: string;
  scriptLine?: string;
  body: string;
  etaChip?: { icon: IoniconName; label: string };
  primaryLabel?: string;
  onPrimary?: () => void;
  children?: React.ReactNode;
};

export function SystemStateLayout({
  icon,
  glowColor,
  title,
  scriptLine,
  body,
  etaChip,
  primaryLabel,
  onPrimary,
  children,
}: Props) {
  return (
    <PenpotFlowShell contentStyle={styles.center}>
      <View style={styles.iconBlock}>
        <View
          style={[styles.glow, styles.glow1, { backgroundColor: glowColor, opacity: 0.4 }]}
        />
        <View
          style={[styles.glow, styles.glow2, { backgroundColor: glowColor, opacity: 0.6 }]}
        />
        <View
          style={[styles.glow, styles.glow3, { backgroundColor: glowColor, opacity: 0.85 }]}
        />
        <View style={styles.tile}>
          <Ionicons name={icon} size={44} color="#FFFFFF" />
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      {scriptLine ? <Text style={styles.script}>{scriptLine}</Text> : null}
      <Text style={styles.body}>{body}</Text>

      {etaChip ? (
        <View style={styles.etaChip}>
          <Ionicons name={etaChip.icon} size={14} color={Colors.textPrimary} />
          <Text style={styles.etaText}>{etaChip.label}</Text>
        </View>
      ) : null}

      {children}

      {primaryLabel && onPrimary ? (
        <Button title={primaryLabel} onPress={onPrimary} style={{ width: '100%' }} />
      ) : null}
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingHorizontal: 24,
  },
  iconBlock: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    borderRadius: 999,
  },
  glow1: {
    width: 200,
    height: 200,
  },
  glow2: {
    width: 160,
    height: 160,
  },
  glow3: {
    width: 120,
    height: 120,
  },
  tile: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#2A1052',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h1,
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  script: {
    fontFamily: 'DreamingOutloud',
    color: Colors.accentHighlight,
    fontSize: 22,
    textAlign: 'center',
    marginTop: -6,
  },
  body: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  etaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF12',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
  },
  etaText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
});
