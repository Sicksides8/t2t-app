import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '../../theme';

type Props = {
  visible: boolean;
  discountLabel: string;
  headline: string;
  subtitle: string;
  pricePitch: string;
  priceMain: string;
  priceFootnote: string;
  durationMs: number;
  ctaLabel: string;
  restoreLabel: string;
  onAccept: () => void;
  onRestore: () => void;
  onClose: () => void;
};

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function HookSpecialOffer({
  visible,
  discountLabel,
  headline,
  subtitle,
  pricePitch,
  priceMain,
  priceFootnote,
  durationMs,
  ctaLabel,
  restoreLabel,
  onAccept,
  onRestore,
  onClose,
}: Props) {
  const [remaining, setRemaining] = useState(durationMs);

  useEffect(() => {
    if (!visible) return undefined;
    setRemaining(durationMs);
    const start = Date.now();
    const t = setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(0, durationMs - elapsed);
      setRemaining(left);
      if (left <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [visible, durationMs]);

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Pressable
            onPress={onClose}
            style={styles.close}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            hitSlop={12}
          >
            <Ionicons name="close" size={20} color={Colors.textPrimary} />
          </Pressable>

          <LinearGradient
            colors={['#7A22B5', '#B73CEF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.banner}
          >
            <Text style={styles.discount}>{discountLabel}</Text>
            <View style={styles.ribbon}>
              <Text style={styles.ribbonText} numberOfLines={1}>
                T2T PRO · T2T PRO · T2T PRO · T2T PRO
              </Text>
            </View>
          </LinearGradient>

          <View style={styles.timer}>
            <Ionicons name="time-outline" size={14} color={Colors.accentHighlight} />
            <Text style={styles.timerText}>Termina en {formatRemaining(remaining)}</Text>
          </View>

          <Text style={styles.headline}>{headline}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <View style={styles.priceCard}>
            <Text style={styles.pricePitch}>{pricePitch}</Text>
            <Text style={styles.priceMain}>{priceMain}</Text>
            <Text style={styles.priceFootnote}>{priceFootnote}</Text>
          </View>

          <Pressable onPress={onAccept} style={styles.acceptBtn} accessibilityRole="button">
            <Text style={styles.acceptText}>{ctaLabel}</Text>
          </Pressable>

          <Pressable onPress={onRestore} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.restore}>{restoreLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,2,30,0.85)',
    paddingHorizontal: 18,
    paddingTop: 60,
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    gap: 18,
    backgroundColor: Colors.bgPrimary,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF14',
  },
  close: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    borderRadius: 20,
    paddingTop: 22,
    paddingBottom: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  discount: {
    color: Colors.textPrimary,
    fontWeight: '900',
    fontSize: 56,
    letterSpacing: -1.6,
  },
  ribbon: {
    width: '160%',
    backgroundColor: '#1A0030',
    paddingVertical: 4,
    transform: [{ rotate: '-4deg' }],
    marginTop: 6,
  },
  ribbonText: {
    color: '#B73CEF',
    fontWeight: '900',
    letterSpacing: 1.2,
    textAlign: 'center',
    fontSize: 12,
  },
  timer: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#4CC35B22',
    borderWidth: 1,
    borderColor: '#4CC35B66',
  },
  timerText: {
    color: Colors.accentHighlight,
    fontWeight: '700',
    fontSize: 12,
  },
  headline: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: -10,
    fontSize: 14,
  },
  priceCard: {
    borderRadius: 18,
    backgroundColor: '#1F0A40CC',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  pricePitch: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  priceMain: {
    color: Colors.accentHighlight,
    fontWeight: '900',
    fontSize: 32,
  },
  priceFootnote: {
    color: Colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
  acceptBtn: {
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: Colors.accentPrimary,
    alignItems: 'center',
  },
  acceptText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  restore: {
    color: Colors.accentPrimary,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 13,
  },
});
