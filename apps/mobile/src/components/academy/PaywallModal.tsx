/**
 * PaywallModal — bloquea acceso a contenido premium con CTA "Probar 7 días gratis".
 *
 * Flujo:
 *  - "Probar gratis" -> startTrial(user.id, planId, cycle) del provider activo.
 *  - "Restaurar compras" -> restorePurchases (Google Play cuando está activo).
 *  - "Más adelante"  -> cierra sin acción.
 */
import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import {
  getBillingProvider,
  getCanonicalPlan,
  restorePurchases,
  usesNativeStoreBilling,
} from '../../services/subscriptionService';
import type { BillingCycle, SubscriptionPlanId } from '../../types';

type Props = {
  visible: boolean;
  planId?: SubscriptionPlanId;
  /** Ciclo inicial; el usuario puede cambiarlo con el toggle. */
  defaultCycle?: BillingCycle;
  title?: string;
  description?: string;
  userId: string | null | undefined;
  onClose: () => void;
  onSuccess?: () => void;
};

export function PaywallModal({
  visible,
  planId = 'pro',
  defaultCycle = 'monthly',
  title = 'Contenido Pro',
  description = 'Desbloqueá todos los cursos con 7 días gratis. Sin tarjeta, cancelás cuando quieras.',
  userId,
  onClose,
  onSuccess,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>(defaultCycle);
  const plan = getCanonicalPlan(planId);
  const price = cycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  const periodLabel = cycle === 'monthly' ? '/ mes' : '/ año';

  const startTrial = async () => {
    if (!userId) {
      setError('Iniciá sesión para activar tu trial.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await getBillingProvider().startTrial(userId, planId, cycle);
      onSuccess?.();
      onClose();
    } catch {
      setError('No se pudo activar el trial. Intentá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!userId) {
      setError('Iniciá sesión para restaurar compras.');
      return;
    }
    if (!usesNativeStoreBilling()) {
      setError('Restaurar compras está disponible en la app instalada desde la tienda.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await restorePurchases(userId);
      onSuccess?.();
      onClose();
    } catch {
      setError('No se encontraron compras para restaurar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <LinearGradient
            colors={['#6E1AAE', '#C040EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.iconCircle}>
              <Ionicons name="lock-closed" size={28} color={Colors.textPrimary} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{description}</Text>
          </LinearGradient>

          <View style={styles.body}>
            <View style={styles.toggle}>
              <Pressable
                style={[styles.toggleBtn, cycle === 'monthly' && styles.toggleBtnActive]}
                onPress={() => setCycle('monthly')}
              >
                <Text style={[styles.toggleText, cycle === 'monthly' && styles.toggleTextActive]}>
                  Mensual
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleBtn, cycle === 'yearly' && styles.toggleBtnActive]}
                onPress={() => setCycle('yearly')}
              >
                <Text style={[styles.toggleText, cycle === 'yearly' && styles.toggleTextActive]}>
                  Anual
                </Text>
              </Pressable>
            </View>

            <View style={styles.row}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.accentHighlight} />
              <Text style={styles.bullet}>Catálogo completo desbloqueado</Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.accentHighlight} />
              <Text style={styles.bullet}>Certificados al finalizar cada curso</Text>
            </View>
            <View style={styles.row}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.accentHighlight} />
              <Text style={styles.bullet}>
                7 días gratis, luego {plan.currency} {price.toFixed(2)} {periodLabel}
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => void startTrial()}
              disabled={busy}
              style={[styles.primaryBtn, busy && { opacity: 0.7 }]}
            >
              {busy ? (
                <ActivityIndicator color={Colors.textPrimary} />
              ) : (
                <Text style={styles.primaryText}>Probar 7 días gratis</Text>
              )}
            </Pressable>

            {usesNativeStoreBilling() ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void handleRestore()}
                disabled={busy}
                style={styles.restoreBtn}
              >
                <Text style={styles.restoreText}>Restaurar compras</Text>
              </Pressable>
            ) : null}

            <Pressable accessibilityRole="button" onPress={onClose} style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>Más adelante</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: Radius.cardLg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFFFFF1A',
  },
  hero: {
    padding: Spacing.lg,
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF26',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF44',
  },
  title: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#FFFFFFCC',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  body: {
    padding: Spacing.lg,
    gap: 12,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#1F0A40',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    marginBottom: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: Colors.accentPrimary,
  },
  toggleText: {
    color: Colors.textTertiary,
    fontWeight: '700',
    fontSize: 13,
  },
  toggleTextActive: {
    color: Colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bullet: {
    color: Colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  error: {
    color: '#FF6B6B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: Colors.accentPrimary,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryText: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 15,
  },
  restoreBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  restoreText: {
    color: Colors.accentHighlight,
    fontWeight: '700',
    fontSize: 13,
  },
  secondaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryText: {
    color: Colors.textTertiary,
    fontWeight: '600',
    fontSize: 13,
  },
});
