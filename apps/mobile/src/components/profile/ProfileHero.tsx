import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { profileInitials } from '../../utils/profileStats';
import { Colors, Typography } from '../../theme';

type ProfileHeroProps = {
  displayName: string;
  email: string;
  avatarUrl?: string;
  planName: string;
  onPressAvatar?: () => void;
};

export function ProfileHero({ displayName, email, avatarUrl, planName, onPressAvatar }: ProfileHeroProps) {
  const initials = profileInitials(displayName);

  const inner = avatarUrl ? (
    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
  ) : (
    <LinearGradient
      colors={[Colors.accentPrimary, Colors.accentTeal]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.avatar}
    >
      <Text style={styles.initials}>{initials}</Text>
    </LinearGradient>
  );

  return (
    <View style={styles.wrap}>
      {onPressAvatar ? (
        <Pressable onPress={onPressAvatar} hitSlop={8}>
          {inner}
        </Pressable>
      ) : (
        inner
      )}
      <Pressable onPress={onPressAvatar} disabled={!onPressAvatar}>
        <Text style={styles.name}>{displayName}</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}
      </Pressable>
      <View style={styles.planPill}>
        <MaterialCommunityIcons name="crown" size={15} color="#FFFFFF" />
        <Text style={styles.planText}>Plan {planName} · activo</Text>
      </View>
    </View>
  );
}

const AVATAR = 124;

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 18,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFFFFF40',
  },
  initials: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 1,
  },
  name: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: 16,
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '800',
  },
  email: {
    color: '#C2AAD6',
    marginTop: 4,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  planPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.accentPrimary,
  },
  planText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
