import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Colors, Typography } from '../../theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  icon: IoniconName;
  title: string;
  body: string;
};

export function HookInterstitialOrb({ icon, title, body }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <View style={styles.orb}>
        <Ionicons name={icon} size={72} color={Colors.accentPrimary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 18,
  },
  glow: {
    position: 'absolute',
    top: 14,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#B73CEF33',
  },
  orb: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#B73CEF26',
    borderWidth: 2,
    borderColor: '#B73CEF66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
  },
});
