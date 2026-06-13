import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import type { NotificationType } from '../../types';

type Props = {
  type: NotificationType;
  title: string;
  body: string;
  unread?: boolean;
  onPress?: () => void;
};

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  streak: { icon: 'flame-outline', color: '#FF7A1A', bg: '#FF7A1A33' },
  achievement: { icon: 'trophy-outline', color: Colors.accentHighlight, bg: '#4CC35B33' },
  lesson: { icon: 'play-outline', color: Colors.accentPrimary, bg: '#B73CEF33' },
  system: { icon: 'notifications-outline', color: Colors.textTertiary, bg: '#FFFFFF14' },
};

export function ProfileNotificationRow({ type, title, body, unread, onPress }: Props) {
  const config = TYPE_CONFIG[type];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, unread ? styles.unread : styles.read]}
    >
      <View style={[styles.tile, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={22} color={config.color} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.bodyText} numberOfLines={2}>
          {body}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  unread: {
    backgroundColor: '#2A1052',
    borderWidth: 1.5,
    borderColor: Colors.accentPrimary,
    shadowColor: Colors.accentPrimary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  read: {
    backgroundColor: '#1F0A40CC',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
  },
  tile: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
});
