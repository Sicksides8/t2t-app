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

const SIZE = 104;

export function ProfileEditAvatar({ displayName, avatarUrl, onPress }: Props) {
  const initials = profileInitials(displayName);

  return (
    <View style={styles.wrap}>
      <Pressable onPress={onPress} style={styles.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={[Colors.accentPrimary, Colors.accentTertiary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.initials}>{initials}</Text>
          </LinearGradient>
        )}
        <View style={styles.cam}>
          <Ionicons name="camera" size={16} color={Colors.textPrimary} />
        </View>
      </Pressable>
      <Text style={styles.hint}>Tocá para cambiar tu foto</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 16,
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
    borderColor: '#FFFFFF1F',
    overflow: 'hidden',
  },
  initials: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cam: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.accentPrimary,
    borderWidth: 3,
    borderColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accentPrimary,
  },
});
