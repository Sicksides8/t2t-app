import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui';
import { PenpotFlowShell } from '../penpot';
import { Colors, Radius, Spacing, Typography } from '../../theme';

type Props = {
  onNext: () => void;
  onSkipToLogin: () => void;
};

/**
 * Penpot 03_ComoFunciona (NUEVA): primera pantalla del carrusel del inicio.
 * Comunica el value prop "plan creado con IA" + mockup de tarjetas + CTA Empezar.
 */
export function ComoFuncionaScreen({ onNext, onSkipToLogin }: Props) {
  return (
    <PenpotFlowShell
      orbVariant="default"
      contentStyle={styles.content}
      scroll
      footer={
        <View style={styles.footer}>
          <Button title="Empezar" onPress={onNext} />
          <Text style={styles.footerCaption}>
            Únete a T2T y entrena las habilidades que definen tu futuro profesional.
          </Text>
        </View>
      }
    >
      <View style={styles.topBar}>
        <Text style={styles.brand}>T2T</Text>
        <Pressable hitSlop={8} onPress={onSkipToLogin}>
          <Text style={styles.loginLink}>Iniciar Sesión</Text>
        </Pressable>
      </View>

      <Text style={styles.title}>
        Tu plan creado con <Text style={styles.titleAccent}>IA</Text>. Entrenado por ti.
      </Text>
      <Text style={styles.subtitle}>
        T2T Academy usa IA para armar tu entrenamiento de habilidades blandas, según tu diagnóstico
        y tus objetivos.
      </Text>

      <View style={styles.cardsWrap}>
        <SessionsCard style={styles.cardBack} />
        <PlanCard style={styles.cardFront} />
      </View>
    </PenpotFlowShell>
  );
}

/** Tarjeta frontal: "Tu plan" con barras de habilidades. */
function PlanCard({ style }: { style?: ViewStyle }) {
  const skills: { name: string; icon: keyof typeof Ionicons.glyphMap; value: number }[] = [
    { name: 'Comunicación', icon: 'chatbubble-ellipses', value: 70 },
    { name: 'Liderazgo', icon: 'ribbon', value: 55 },
    { name: 'Empatía', icon: 'heart', value: 65 },
    { name: 'Foco', icon: 'aperture', value: 45 },
  ];
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Tu plan</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>12 hab</Text>
        </View>
      </View>
      <Text style={styles.cardCaption}>Esta semana</Text>
      <View style={styles.skillList}>
        {skills.map((s) => (
          <View key={s.name} style={styles.skillRow}>
            <View style={styles.skillIcon}>
              <Ionicons name={s.icon} size={14} color={Colors.textPrimary} />
            </View>
            <View style={styles.skillTextWrap}>
              <Text style={styles.skillName}>{s.name}</Text>
              <View style={styles.skillTrack}>
                <View style={[styles.skillFill, { width: `${s.value}%` }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Tarjeta trasera: "Comunicación" con sesiones de hoy. */
function SessionsCard({ style }: { style?: ViewStyle }) {
  const sessions: { label: string; done: boolean }[] = [
    { label: 'Escucha activa', done: true },
    { label: 'Feedback claro', done: true },
    { label: 'Hablar en público', done: false },
  ];
  return (
    <View style={[styles.card, styles.cardSecondary, style]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Comunicación</Text>
        <Ionicons name="heart" size={16} color={Colors.accentHighlight} />
      </View>
      <Text style={styles.cardCaption}>Sesiones de hoy</Text>
      <View style={styles.sessionList}>
        {sessions.map((s, i) => (
          <View key={s.label} style={styles.sessionRow}>
            <View style={[styles.sessionIndex, s.done && styles.sessionIndexDone]}>
              <Text style={styles.sessionIndexText}>{i + 1}</Text>
            </View>
            <Text style={styles.sessionLabel} numberOfLines={1}>
              {s.label}
            </Text>
            {s.done ? (
              <Ionicons name="checkmark" size={14} color={Colors.accentHighlight} />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

const CARD_BG = '#1A0A38';
const CARD_BG_SECONDARY = '#0F0626';
const SKILL_TRACK_BG = '#FFFFFF14';

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: Spacing.sm,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  brand: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  loginLink: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  title: {
    ...Typography.hero,
    color: Colors.textPrimary,
    fontSize: 30,
    lineHeight: 36,
    marginTop: Spacing.lg,
  },
  titleAccent: {
    color: Colors.accentHighlight,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.md,
  },
  cardsWrap: {
    height: 320,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  card: {
    position: 'absolute',
    borderRadius: Radius.cardLg,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: Colors.divider,
    padding: Spacing.lg,
    width: '74%',
  },
  cardSecondary: {
    backgroundColor: CARD_BG_SECONDARY,
  },
  cardFront: {
    top: 0,
    left: 0,
    height: 280,
    zIndex: 2,
  },
  cardBack: {
    top: 24,
    right: 0,
    height: 260,
    zIndex: 1,
    opacity: 0.95,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  cardCaption: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    fontSize: 11,
  },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: '#4CC35B33',
    borderWidth: 1,
    borderColor: '#4CC35B66',
  },
  chipText: {
    color: Colors.accentHighlight,
    fontSize: 11,
    fontWeight: '700',
  },
  skillList: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  skillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  skillIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skillTextWrap: {
    flex: 1,
    gap: 4,
  },
  skillName: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 12,
  },
  skillTrack: {
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: SKILL_TRACK_BG,
    overflow: 'hidden',
  },
  skillFill: {
    height: '100%',
    backgroundColor: Colors.accentHighlight,
    borderRadius: Radius.pill,
  },
  sessionList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFFFFF0A',
    borderRadius: Radius.chip,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
  },
  sessionIndex: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionIndexDone: {
    backgroundColor: '#4CC35B33',
  },
  sessionIndexText: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
  },
  sessionLabel: {
    flex: 1,
    ...Typography.caption,
    color: Colors.textPrimary,
    fontSize: 12,
  },
  footer: {
    gap: Spacing.md,
  },
  footerCaption: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: Spacing.md,
  },
});
