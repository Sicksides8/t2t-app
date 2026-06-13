import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Plan, SubscriptionStatus } from '../../types';

type Props = {
  plan: Plan;
  /** Estado dinámico de la suscripción. Si no se pasa se muestra 'PLAN ACTIVO' por compat. */
  status?: SubscriptionStatus;
  /** Próxima fecha de renovación o fin de trial. */
  renewsAt?: Date;
  /**
   * Texto del renew. Si no se pasa se calcula a partir de `renewsAt`/`status`.
   * Mantenemos el prop antiguo por compat con llamados existentes.
   */
  renewDate?: string;
};

function fmtDate(date?: Date): string {
  if (!date) return '';
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

function badgeLabel(status: SubscriptionStatus, renewsAt?: Date): string {
  if (status === 'trialing') {
    const days = renewsAt ? Math.max(0, Math.ceil((renewsAt.getTime() - Date.now()) / 86_400_000)) : 0;
    return `EN PRUEBA · ${days} DÍA${days === 1 ? '' : 'S'} RESTANTES`;
  }
  if (status === 'cancelled') return `CANCELADO · VENCE ${fmtDate(renewsAt).toUpperCase()}`;
  if (status === 'expired') return 'PLAN VENCIDO';
  if (status === 'active') return 'PLAN ACTIVO';
  return 'PLAN FREE';
}

function renewLabel(status: SubscriptionStatus, renewsAt?: Date): string {
  if (!renewsAt) return '';
  const date = fmtDate(renewsAt);
  if (status === 'trialing') return `Fin del trial: ${date}`;
  if (status === 'cancelled') return `Acceso hasta el ${date}`;
  if (status === 'expired') return 'Renová tu suscripción';
  if (status === 'active') return `Renueva el ${date}`;
  return '';
}

export function ProfilePlanCard({ plan, status, renewsAt, renewDate }: Props) {
  const effectiveStatus: SubscriptionStatus = status ?? 'active';
  const priceLabel = plan.price > 0 ? `${plan.currency} ${plan.price.toFixed(2)} / mes` : 'Gratis';
  const renewText = renewDate ?? renewLabel(effectiveStatus, renewsAt);

  return (
    <View style={styles.glowWrap}>
      <LinearGradient
        colors={['#7E2BD1', '#C040EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <Text style={styles.badge}>{badgeLabel(effectiveStatus, renewsAt)}</Text>
        <Text style={styles.name}>{plan.name.toUpperCase()}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>{priceLabel}</Text>
          {renewText ? <Text style={styles.renew}>{renewText}</Text> : null}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  glowWrap: {
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#C040EE',
    shadowOpacity: 0.6,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  card: {
    borderRadius: 24,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderColor: '#FFFFFF26',
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: '#FFFFFFCC',
  },
  name: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 56,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  renew: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFFCC',
  },
});
