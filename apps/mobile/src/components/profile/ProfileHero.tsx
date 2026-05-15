import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { profileInitials } from '../../utils/profileStats';
import { Colors, Radius, Spacing, Typography } from '../../theme';

type ProfileHeroProps = {
  displayName: string;
  email: string;
  avatarUrl?: string;
  planName: string;
};

export function ProfileHero({ displayName, email, avatarUrl, planName }: ProfileHeroProps) {
  const initials = profileInitials(displayName);

  return (
    <View style={styles.wrap}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      ) : (
        <LinearGradient
          colors={[Colors.accentPrimary, Colors.accentSecondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatar}
        >
          <Text style={styles.initials}>{initials}</Text>
        </LinearGradient>
      )}
      <Text style={styles.name}>{displayName}</Text>
      <Text style={styles.email}>{email}</Text>
      <View style={styles.planPill}>
        <Ionicons name="ribbon" size={14} color={Colors.warning} />
        <Text style={styles.planText}>
          Plan {planName} · activo
        </Text>
      </View>
    </View>
  );
}

const AVATAR = 96;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF33',
  },
  initials: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
  },
  name: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  email: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  planText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
});
