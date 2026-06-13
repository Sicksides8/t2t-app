import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography } from '../../theme';
import type { HookPricingPlan } from '../../data/hooksFlow';

type Props = {
  plans: HookPricingPlan[];
  stats: { value: string; label: string }[];
  defaultPeriod: 'monthly' | 'yearly';
  selectedPlanId: HookPricingPlan['id'] | null;
  onSelectPlan: (id: HookPricingPlan['id']) => void;
};

export function HookPricingScreen({
  plans,
  stats,
  defaultPeriod,
  selectedPlanId,
  onSelectPlan,
}: Props) {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>(defaultPeriod);

  return (
    <View style={styles.wrap}>
      <View style={styles.toggle}>
        <Pressable
          style={[styles.toggleBtn, period === 'monthly' && styles.toggleBtnActive]}
          onPress={() => setPeriod('monthly')}
        >
          <Text style={[styles.toggleText, period === 'monthly' && styles.toggleTextActive]}>
            Mensual
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, period === 'yearly' && styles.toggleBtnActive]}
          onPress={() => setPeriod('yearly')}
        >
          <Text style={[styles.toggleText, period === 'yearly' && styles.toggleTextActive]}>
            Anual
          </Text>
          <View style={styles.discountChip}>
            <Text style={styles.discountText}>-20%</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.plans}>
        {plans.map((plan) => (
          <PricingPlanCard
            key={plan.id}
            plan={plan}
            period={period}
            selected={selectedPlanId === plan.id}
            onPress={() => onSelectPlan(plan.id)}
          />
        ))}
      </View>
    </View>
  );
}

function PricingPlanCard({
  plan,
  period,
  selected,
  onPress,
}: {
  plan: HookPricingPlan;
  period: 'monthly' | 'yearly';
  selected: boolean;
  onPress: () => void;
}) {
  const price = period === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  const priceLabel = price === 0 ? 'USD 0' : `USD ${price.toFixed(2)}`;
  const periodLabel = period === 'monthly' ? '/ por mes' : '/ por año';

  if (plan.variant === 'pro') {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
        {plan.highlight === 'mostPopular' ? (
          <View style={styles.popularChip}>
            <Text style={styles.popularChipText}>MÁS POPULAR</Text>
          </View>
        ) : null}
        <LinearGradient
          colors={['#A55CE0', '#B73CEF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.proCard, selected && styles.cardSelected]}
        >
          <View style={styles.proRow}>
            <View style={styles.proCol}>
              <Text style={styles.proTitle}>{plan.name}</Text>
              <Text style={styles.proPitch}>{plan.pitch}</Text>
            </View>
            <View style={styles.proPriceCol}>
              <Text style={styles.proPrice}>{priceLabel}</Text>
              <Text style={styles.proPeriod}>{periodLabel}</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  if (plan.variant === 'elite') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={[styles.eliteCard, selected && styles.cardSelected]}
      >
        <View style={styles.eliteRow}>
          <View style={styles.eliteCol}>
            <View style={styles.eliteTitleRow}>
              <Text style={styles.eliteTitle}>{plan.name}</Text>
              <View style={styles.comingChip}>
                <Text style={styles.comingChipText}>PRÓXIMAMENTE 1:1</Text>
              </View>
            </View>
            <Text style={styles.elitePitch}>{plan.pitch}</Text>
          </View>
          <View style={styles.proPriceCol}>
            <Text style={styles.elitePrice}>{priceLabel}</Text>
            <Text style={styles.proPeriod}>{periodLabel}</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // FREE
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.freeCard, selected && styles.cardSelected]}
    >
      <View style={styles.proRow}>
        <View style={styles.proCol}>
          <Text style={styles.freeTitle}>{plan.name}</Text>
          <Text style={styles.freePitch}>{plan.pitch}</Text>
        </View>
        <View style={styles.proPriceCol}>
          <Text style={styles.freePrice}>{priceLabel}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 20,
    paddingTop: 6,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#1F0A40',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF14',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  toggleBtnActive: {
    backgroundColor: Colors.accentPrimary,
  },
  toggleText: {
    color: Colors.textTertiary,
    fontWeight: '700',
    fontSize: 14,
  },
  toggleTextActive: {
    color: Colors.textPrimary,
  },
  discountChip: {
    backgroundColor: Colors.accentHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  discountText: {
    color: '#0E2A14',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    color: Colors.accentHighlight,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
  plans: {
    gap: 14,
    marginTop: 4,
  },
  popularChip: {
    position: 'absolute',
    top: -12,
    left: 16,
    backgroundColor: Colors.accentHighlight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    zIndex: 2,
  },
  popularChipText: {
    color: '#0E2A14',
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.7,
  },
  proCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proCol: {
    flex: 1,
  },
  proTitle: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  proPitch: {
    color: '#FFFFFFCC',
    fontSize: 13,
    marginTop: 4,
  },
  proPriceCol: {
    alignItems: 'flex-end',
  },
  proPrice: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  proPeriod: {
    color: '#FFFFFFCC',
    fontSize: 11,
    marginTop: 2,
  },
  freeCard: {
    backgroundColor: '#2A1052',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FFFFFF1A',
  },
  freeTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  freePitch: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 4,
  },
  freePrice: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  eliteCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.accentHighlight,
    backgroundColor: '#0E2A1422',
  },
  eliteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eliteCol: {
    flex: 1,
  },
  eliteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  eliteTitle: {
    color: Colors.accentHighlight,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  comingChip: {
    backgroundColor: Colors.accentOrange,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  comingChipText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 9,
    letterSpacing: 0.6,
  },
  elitePitch: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 6,
  },
  elitePrice: {
    color: Colors.accentHighlight,
    fontSize: 16,
    fontWeight: '800',
  },
  cardSelected: {
    borderColor: Colors.accentPrimary,
    borderWidth: 2,
  },
});
