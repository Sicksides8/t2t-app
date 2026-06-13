import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { profileInitials } from '../../utils/profileStats';
import { Colors } from '../../theme';

type Props = {
  displayName: string;
  avatarUrl?: string;
  onPress: () => void;
};

const SIZE = 124;
const BADGE = 38;

export function ProfileEditAvatar({ displayName, avatarUrl, onPress }: Props) {
  const initials = profileInitials(displayName);

  return (
    <View style={styles.wrap}>
      <Pressable onPress={onPress} style={styles.avatarWrap}>
        {avatarUrl ? (
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
        )}
        <View style={styles.cam} pointerEvents="none">
          <Ionicons name="camera" size={18} color={Colors.textPrimary} />
        </View>
      </Pressable>
      <Pressable onPress={onPress} hitSlop={8}>
        <Text style={styles.hint}>Toca para cambiar tu foto</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 18,
  },
  avatarWrap: {
    width: SIZE,
    height: SIZE,
  },
  avatar: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF40',
    overflow: 'hidden',
  },
  initials: {
    fontSize: 40,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  cam: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: Colors.accentPrimary,
    borderWidth: 3,
    borderColor: '#1F0A40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accentPrimary,
    marginTop: 12,
  },
});
