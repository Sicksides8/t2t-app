import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme';

type Props = {
  title: string;
  subtitle: string;
  onPress: () => void;
};

export function ProfileCertificateRow({ title, subtitle, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <LinearGradient colors={['#FFF7E8', '#E5D9C0']} style={styles.thumb}>
        <Ionicons name="ribbon" size={28} color={Colors.accentPrimary} />
      </LinearGradient>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 12,
  },
  thumb: {
    width: 72,
    height: 90,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
});
