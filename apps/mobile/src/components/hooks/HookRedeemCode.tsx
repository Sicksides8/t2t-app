import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '../../theme';

type Props = {
  title: string;
  subtitle: string;
  placeholder: string;
  infoBody: string;
  value: string;
  onChangeText: (v: string) => void;
};

function formatCode(raw: string): string {
  const cleaned = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
  if (cleaned.length <= 4) return cleaned;
  return `${cleaned.slice(0, 4)} - ${cleaned.slice(4)}`;
}

export function HookRedeemCode({ title, subtitle, placeholder, infoBody, value, onChangeText }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <View style={styles.glow} />
      <LinearGradient
        colors={['#2E9540', '#34D6C2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.tile}
      >
        <Ionicons name="gift" size={56} color={Colors.textPrimary} />
      </LinearGradient>

      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <TextInput
        value={value}
        onChangeText={(t) => onChangeText(formatCode(t))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        autoCapitalize="characters"
        autoCorrect={false}
        selectionColor={Colors.accentPrimary}
        style={[styles.input, focused && styles.inputFocused]}
      />

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.accentTeal} />
        <Text style={styles.infoBody}>{infoBody}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 18,
    paddingTop: 14,
  },
  glow: {
    position: 'absolute',
    top: 0,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#34D6C233',
  },
  tile: {
    width: 120,
    height: 120,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4CC35B',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  head: {
    alignItems: 'center',
    gap: 6,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  input: {
    alignSelf: 'stretch',
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#2A1052',
    borderWidth: 1.5,
    borderColor: '#FFFFFF1F',
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
    fontFamily: undefined,
  },
  inputFocused: {
    borderColor: Colors.accentPrimary,
    borderWidth: 2,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 10,
    alignSelf: 'stretch',
    backgroundColor: '#1F0A40CC',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    borderRadius: 14,
    padding: 14,
  },
  infoBody: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
