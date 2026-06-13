import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, SvgProgressRing, T2TCoin } from '../ui';
import { AppBackground } from '../penpot';
import { Colors, Spacing, Typography } from '../../theme';

export type CelebrationVariant = 'module' | 'course';

type Props = {
  visible: boolean;
  title: string;
  body?: string;
  coins?: number;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
  onClose: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: CelebrationVariant;
  progressPercent?: number;
  streakDelta?: number;
};

export function CelebrationModal({
  visible,
  title,
  body,
  coins,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onClose,
  icon,
  variant = 'course',
  progressPercent = 0,
  streakDelta,
}: Props) {
  const isModule = variant === 'module';

  return (
    <Modal animationType="fade" visible={visible} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.screen}>
        <AppBackground variant="default" />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
          <View style={styles.content}>
            {isModule ? (
              <View style={styles.polaroidWrap}>
                <View style={styles.ribbon} />
                <View style={styles.polaroid}>
                  <Text style={styles.polaroidScript}>¡Módulo completado!</Text>
                </View>
              </View>
            ) : (
              <LinearGradient
                colors={[Colors.accentHighlight, Colors.accentPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconWrap}
              >
                <Ionicons name={icon ?? 'trophy'} size={48} color={Colors.textPrimary} />
              </LinearGradient>
            )}

            {isModule ? (
              <View style={styles.ringWrap}>
                <SvgProgressRing value={progressPercent} size={96} strokeWidth={9} />
              </View>
            ) : (
              <Text style={styles.title}>{title}</Text>
            )}

            {!isModule && body ? <Text style={styles.body}>{body}</Text> : null}

            {coins != null && coins > 0 ? (
              <View style={styles.coinsChip}>
                <T2TCoin size={22} />
                <Text style={styles.coinsText}>+{coins} T2T Coins</Text>
              </View>
            ) : null}

            {isModule && (streakDelta ?? 0) > 0 ? (
              <View style={styles.streakRow}>
                <Ionicons name="flame" size={20} color={Colors.accentOrangeWarm} />
                <Text style={styles.streakText}>
                  +{streakDelta} {streakDelta === 1 ? 'día' : 'días'} de racha
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Button title={primaryLabel} onPress={onPrimary} />
            {secondaryLabel && onSecondary ? (
              <Pressable onPress={onSecondary} style={styles.secondaryBtn} hitSlop={10}>
                <Text style={styles.secondaryText}>{secondaryLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  polaroidWrap: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 6,
  },
  ribbon: {
    position: 'absolute',
    top: -8,
    width: 90,
    height: 16,
    backgroundColor: '#4CC35BB3',
    borderRadius: 4,
    transform: [{ rotate: '-3deg' }],
    zIndex: 1,
  },
  polaroid: {
    width: '88%',
    backgroundColor: Colors.cream,
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  polaroidScript: {
    fontFamily: 'DreamingOutloud',
    color: '#2E9540',
    fontSize: 30,
    textAlign: 'center',
  },
  ringWrap: {
    marginTop: 4,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '800',
  },
  body: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  coinsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#4CC35B33',
    borderWidth: 1,
    borderColor: '#4CC35B66',
  },
  coinsText: {
    color: Colors.accentHighlight,
    fontWeight: '800',
    fontSize: 14,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  streakText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  actions: {
    width: '100%',
    paddingBottom: 8,
    gap: 6,
  },
  secondaryBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.md,
  },
  secondaryText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
});
