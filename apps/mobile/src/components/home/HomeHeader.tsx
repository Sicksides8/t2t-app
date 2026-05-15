import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { profileInitials } from '../../utils/profileStats';
import { Colors, Radius, Spacing, Typography } from '../../theme';

type Props = {
  firstName: string;
  avatarUrl?: string;
  displayName: string;
  hasUnreadNotifications: boolean;
  onNotificationsPress: () => void;
  onAvatarPress: () => void;
};

export function HomeHeader({
  firstName,
  avatarUrl,
  displayName,
  hasUnreadNotifications,
  onNotificationsPress,
  onAvatarPress,
}: Props) {
  const initials = profileInitials(displayName);

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text style={styles.greeting}>
          Hola, {firstName} 👋
        </Text>
        <Text style={styles.subtitle}>Listo para entrenar tu mente</Text>
      </View>
      <View style={styles.right}>
        <Pressable
          onPress={onNotificationsPress}
          style={({ pressed }) => [styles.notifBtn, pressed && styles.pressed]}
          accessibilityLabel="Notificaciones"
        >
          <Ionicons name="notifications-outline" size={20} color={Colors.textPrimary} />
          {hasUnreadNotifications ? <View style={styles.badge} /> : null}
        </Pressable>
        <Pressable onPress={onAvatarPress} style={({ pressed }) => [pressed && styles.pressed]}>
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
        </Pressable>
      </View>
    </View>
  );
}

const AVATAR = 40;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  left: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.sm,
  },
  greeting: {
    fontFamily: Typography.h2.fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontSize: 13,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentHighlight,
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF33',
  },
  initials: {
    fontFamily: Typography.h2.fontFamily,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  pressed: {
    opacity: 0.88,
  },
});
