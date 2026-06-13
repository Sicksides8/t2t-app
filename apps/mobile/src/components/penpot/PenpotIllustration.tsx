import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { PenpotIllustrationKey } from '../../data/penpotFrames';
import { T2TLogo } from '../../assets/brand';
import { Colors } from '../../theme';

const ICON_MAP: Record<PenpotIllustrationKey, keyof typeof Ionicons.glyphMap> = {
  logo: 'school',
  welcome: 'hand-left',
  story: 'sparkles',
  question: 'help-circle',
  thinking: 'hourglass',
  result: 'analytics',
  closure: 'rocket',
  auth: 'person-add',
  reset: 'key',
  verify: 'mail',
  gift: 'gift',
};

type Props = {
  illustrationKey: PenpotIllustrationKey;
  size?: number;
  label?: string;
};

/** Placeholder hasta exportar PNG desde Penpot → assets/penpot/ */
export function PenpotIllustration({ illustrationKey, size = 120, label }: Props) {
  if (illustrationKey === 'logo') {
    return (
      <View style={styles.logoWrap}>
        <Image
          source={T2TLogo}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          resizeMode="cover"
        />
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>
    );
  }

  const icon = ICON_MAP[illustrationKey];
  return (
    <LinearGradient
      colors={[Colors.accentPrimary, Colors.bgSurface]}
      style={[styles.box, { width: size, height: size, borderRadius: size * 0.28 }]}
    >
      <Ionicons name={icon} size={size * 0.42} color={Colors.textPrimary} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
