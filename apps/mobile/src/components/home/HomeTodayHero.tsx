import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Typography } from '../../theme';

type Props = {
  title: string;
  meta: string;
  thumbnail?: string;
  onPress: () => void;
};

export function HomeTodayHero({ title, meta, thumbnail, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <LinearGradient
        colors={[Colors.accentHighlight, Colors.accentPrimary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumb} resizeMode="cover" />
        ) : null}
        <LinearGradient
          colors={['#1D083A00', '#1D083ACC']}
          style={styles.overlay}
          pointerEvents="none"
        />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>RUTINA DE HOY</Text>
        </View>
        <View style={styles.playWrap} pointerEvents="none">
          <View style={styles.playBtn}>
            <Ionicons name="play" size={28} color={Colors.textPrimary} style={styles.playIcon} />
          </View>
        </View>
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 200,
    borderRadius: Radius.cardLg,
    overflow: 'hidden',
    marginBottom: 18,
    shadowColor: '#B73CEF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  pressed: {
    opacity: 0.95,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  thumb: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    backgroundColor: '#1A003088',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
  },
  badgeText: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: Colors.textPrimary,
  },
  playWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF26',
    borderWidth: 1,
    borderColor: '#FFFFFF66',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 3,
  },
  info: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 2,
    zIndex: 2,
  },
  title: {
    fontFamily: Typography.h2.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  meta: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});
