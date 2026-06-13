import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui';
import { PenpotFlowShell } from '../penpot';
import { Colors, Radius, Spacing, Typography } from '../../theme';

type Props = {
  onStart: () => void;
  onExplore: () => void;
};

type RowConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  tint: 'green' | 'purple';
  label: string;
  duration: string;
};

const ROWS: RowConfig[] = [
  { icon: 'book-outline', tint: 'green', label: 'Módulo: Decidir bajo presión', duration: '2 min' },
  { icon: 'chatbubble-outline', tint: 'purple', label: 'Reto: Practicar en una reunión real', duration: '3 min' },
  { icon: 'sparkles', tint: 'green', label: 'Reflexión guiada', duration: '1 min' },
];

/** Penpot 35_Cierre — cierre del onboarding pre-registro. */
export function OnboardingCierreScreen({ onStart, onExplore }: Props) {
  return (
    <PenpotFlowShell
      orbVariant="default"
      contentStyle={styles.content}
      footer={
        <View style={styles.footer}>
          <Button title="Empezar mi primer día" onPress={onStart} />
          <Pressable onPress={onExplore} style={styles.exploreWrap} hitSlop={8}>
            <Text style={styles.exploreText}>Explorar mi plan</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.header}>
        <Text style={styles.script}>Bienvenido</Text>
        <Text style={styles.title}>Aquí empieza tu entrenamiento</Text>
        <Text style={styles.body}>
          Tu plan se adapta a ti: sesiones cortas, retos reales y feedback continuo.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIconBox}>
            <Ionicons name="radio-button-on" size={22} color={Colors.textPrimary} />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>Tu primer entrenamiento</Text>
            <Text style={styles.cardSubtitle}>5 min · Liderazgo básico</Text>
          </View>
          <View style={styles.dayPill}>
            <Text style={styles.dayPillText}>Día 1</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {ROWS.map((row, i) => (
          <React.Fragment key={row.label}>
            <View style={styles.row}>
              <View
                style={[
                  styles.rowIconBox,
                  row.tint === 'green' ? styles.rowIconGreen : styles.rowIconPurple,
                ]}
              >
                <Ionicons
                  name={row.icon}
                  size={16}
                  color={row.tint === 'green' ? Colors.accentHighlight : Colors.accentPrimary}
                />
              </View>
              <Text style={styles.rowLabel} numberOfLines={1}>
                {row.label}
              </Text>
              <Text style={styles.rowDuration}>{row.duration}</Text>
            </View>
            {i < ROWS.length - 1 ? <View style={styles.rowDivider} /> : null}
          </React.Fragment>
        ))}
      </View>
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  header: {
    gap: 6,
    marginBottom: Spacing.lg,
  },
  script: {
    ...Typography.handwritten,
    color: Colors.accentHighlight,
    fontSize: 30,
    lineHeight: 36,
  },
  title: {
    ...Typography.h1,
    fontSize: 28,
    lineHeight: 34,
    color: Colors.textPrimary,
  },
  body: {
    ...Typography.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  card: {
    borderRadius: Radius.cardLg,
    backgroundColor: '#FFFFFF0F',
    borderWidth: 1,
    borderColor: '#FFFFFF1A',
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: 15,
  },
  cardSubtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 12,
  },
  dayPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: `${Colors.accentHighlight}24`,
    borderWidth: 1,
    borderColor: `${Colors.accentHighlight}66`,
  },
  dayPillText: {
    color: Colors.accentHighlight,
    fontFamily: 'Poppins-Bold',
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#FFFFFF1A',
    marginVertical: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 6,
  },
  rowIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconGreen: {
    backgroundColor: `${Colors.accentHighlight}22`,
  },
  rowIconPurple: {
    backgroundColor: `${Colors.accentPrimary}26`,
  },
  rowLabel: {
    flex: 1,
    ...Typography.body,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  rowDuration: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.textTertiary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#FFFFFF0D',
    marginVertical: 2,
  },
  footer: {
    gap: Spacing.sm,
  },
  exploreWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  exploreText: {
    ...Typography.bodyMedium,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
