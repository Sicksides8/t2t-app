import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '../../theme';

type Props = {
  planLabel: string;
  trialDays: number;
  trialCaption: string;
  afterPricing: string;
  redeemCtaLabel: string;
  onRedeem: () => void;
};

/** Body de la pantalla "Confirmar plan" (paso 10).
 *  Los CTAs Apple/Google viven en el footer fijo de HooksFlowScreen. */
export function HookConfirmPlan({
  planLabel,
  trialDays,
  trialCaption,
  afterPricing,
  redeemCtaLabel,
  onRedeem,
}: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.heroOuter}>
        <View style={styles.heroGlow} />
        <LinearGradient
          colors={['#6E1AAE', '#D456FF']}
          start={{ x: 0, y: 0.1 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 1]}
          style={styles.heroCard}
        >
          <Text style={styles.label}>{planLabel}</Text>
          <View style={styles.heroRow}>
            <Text style={styles.hero}>{trialDays} días</Text>
            <Text style={styles.heroInline}>{trialCaption}</Text>
          </View>
          <Text style={styles.body}>{afterPricing}</Text>
        </LinearGradient>
      </View>

      <Pressable onPress={onRedeem} style={styles.redeemBtn} accessibilityRole="button">
        <Ionicons name="gift-outline" size={18} color={Colors.accentHighlight} />
        <Text style={styles.redeemText}>{redeemCtaLabel}</Text>
      </Pressable>
    </View>
  );
}

type ConfirmPlanFooterProps = {
  appleCtaLabel: string;
  googleCtaLabel: string;
  footnote: string;
  onApple: () => void;
  onGoogle: () => void;
};

/** Footer fijo con los CTAs de pago para "Confirmar plan". */
export function HookConfirmPlanFooter({
  appleCtaLabel,
  googleCtaLabel,
  footnote,
  onApple,
  onGoogle,
}: ConfirmPlanFooterProps) {
  return (
    <View style={styles.footer}>
      <Pressable onPress={onApple} style={styles.appleBtn} accessibilityRole="button">
        <Ionicons name="logo-apple" size={18} color={Colors.textPrimary} />
        <Text style={styles.appleText}>{appleCtaLabel}</Text>
      </Pressable>
      <Pressable onPress={onGoogle} style={styles.googleBtn} accessibilityRole="button">
        <Ionicons name="globe-outline" size={18} color={Colors.textPrimary} />
        <Text style={styles.googleText}>{googleCtaLabel}</Text>
      </Pressable>
      <Text style={styles.footnote}>{footnote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 18,
    paddingTop: 6,
  },
  heroOuter: {
    marginHorizontal: -12,
  },
  heroGlow: {
    position: 'absolute',
    top: 16,
    left: 8,
    right: 8,
    bottom: -4,
    backgroundColor: '#B73CEF',
    opacity: 0.4,
    borderRadius: 28,
  },
  heroCard: {
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 22,
    gap: 10,
    overflow: 'hidden',
  },
  label: {
    color: '#C2AAD6',
    letterSpacing: 1.6,
    fontWeight: '900',
    fontSize: 11,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 0,
  },
  hero: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 52,
    letterSpacing: -1.5,
    lineHeight: 56,
  },
  heroInline: {
    color: '#C2AAD6',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },
  body: {
    color: '#C2AAD6',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#B73CEF14',
    borderWidth: 1.5,
    borderColor: '#B73CEF55',
  },
  redeemText: {
    color: Colors.accentPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  footer: {
    gap: 10,
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: Colors.accentPrimary,
  },
  appleText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: '#FFFFFF12',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
  },
  googleText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  footnote: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: 2,
  },
});
