import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Typography } from '../../theme';
import type { PlanHorizonDays } from '../../types';

type Props = {
  /** Horizonte total del plan (30 / 60 / 90). */
  horizonDays: PlanHorizonDays;
  /** Cuándo arrancó el plan (para calcular "Día X de N"). */
  startedAt?: Date;
  /** Acción opcional (ej. abrir el plan personalizado). */
  onPress?: () => void;
};

/**
 * Banner de progreso del "plan de entrenamiento" en la home.
 *
 * Aparece sólo cuando el usuario eligió un horizonte (30/60/90 días) durante
 * el onboarding. Muestra el día actual y una barra de progreso hasta el
 * checkpoint final del plan.
 */
export function HomePlanProgressCard({ horizonDays, startedAt, onPress }: Props) {
  const elapsedDays = computeElapsedDays(startedAt);
  const currentDay = Math.min(horizonDays, Math.max(1, elapsedDays + 1));
  /** Días transcurridos (no el día en curso) — evita 3% en el día 1 sin actividad previa. */
  const percent = Math.min(100, Math.round((elapsedDays / horizonDays) * 100));

  const Wrapper: React.ComponentType<{ children: React.ReactNode }> = onPress
    ? ({ children }) => (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.outer, pressed && styles.pressed]}
        >
          {children}
        </Pressable>
      )
    : ({ children }) => <View style={styles.outer}>{children}</View>;

  return (
    <Wrapper>
      <LinearGradient
        colors={['#3B0D6E', '#1F0A40']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="barbell" size={20} color={Colors.accentHighlight} />
          </View>
          <View style={styles.titleCol}>
            <Text style={styles.eyebrow}>TU PLAN DE ENTRENAMIENTO</Text>
            <Text style={styles.title}>
              Día {currentDay} de {horizonDays}
            </Text>
          </View>
          {onPress ? (
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          ) : null}
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>

        <Text style={styles.caption}>
          {percent <= 0
            ? 'Recién arrancás · el progreso suma día a día'
            : percent < 100
              ? `${percent}% del recorrido`
              : 'Checkpoint alcanzado · revisá tu radar'}
        </Text>
      </LinearGradient>
    </Wrapper>
  );
}

function computeElapsedDays(startedAt?: Date): number {
  if (!startedAt) return 0;
  const ms = Date.now() - startedAt.getTime();
  if (ms <= 0) return 0;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

const styles = StyleSheet.create({
  outer: {
    marginBottom: 18,
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    borderRadius: Radius.cardLg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4CC35B22',
    borderWidth: 1,
    borderColor: '#4CC35B55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    gap: 2,
  },
  eyebrow: {
    fontFamily: Typography.caption.fontFamily,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.3,
    color: Colors.textTertiary,
  },
  title: {
    fontFamily: Typography.h2.fontFamily,
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF14',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accentHighlight,
    borderRadius: 3,
  },
  caption: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
});
