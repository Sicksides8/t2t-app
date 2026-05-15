import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme';

export function ProfileGiftHero() {
  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[Colors.accentHighlight, Colors.bgSurface]}
        style={styles.iconBox}
      >
        <Ionicons name="gift" size={56} color={Colors.textPrimary} />
      </LinearGradient>
      <Text style={styles.title}>Canjeá tu código</Text>
      <Text style={styles.subtitle}>Activá tu suscripción de regalo en segundos.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  iconBox: {
    width: 120,
    height: 120,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
