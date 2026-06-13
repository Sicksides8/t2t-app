import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PenpotFlowShell } from '../penpot';
import type { LoaderIconKey, LoaderTask, LoaderTint, ProgressLoaderFrame } from '../../data/onboardingFlow';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  frame: ProgressLoaderFrame;
  /** Tiempo (ms) total de la animación + auto-advance. Default 2400ms. */
  durationMs?: number;
  onComplete: () => void;
};

const ICON_MAP: Record<LoaderIconKey, keyof typeof Ionicons.glyphMap> = {
  sparkles: 'sparkles',
  radar: 'radio-outline',
  layers: 'layers',
  barbell: 'barbell',
};

const TINT_COLORS: Record<LoaderTint, { fill: string; ring: string; track: string; accent: string }> = {
  purple: { fill: '#B73CEF', ring: '#B73CEF66', track: Colors.accentHighlight, accent: Colors.accentPrimary },
  teal: { fill: '#25BFA5', ring: '#25BFA566', track: '#25BFA5', accent: '#25BFA5' },
  green: { fill: '#4CC35B', ring: '#4CC35B66', track: Colors.accentHighlight, accent: Colors.accentHighlight },
};

/**
 * Penpot 16/22/28/31 — loaders intercalados con icono circular, barra animada,
 * % contando, checklist con spinner rotando + auto-advance.
 *
 * Animaciones:
 *  - `progressAnim` (0→1) impulsa el ancho de la barra y el % numérico (vía listener).
 *  - `spinAnim` (loop) rota el indicador del item `inProgress` del checklist.
 *  - `pulseAnim` (loop) escala sutilmente el icono central para reforzar la idea de "trabajando".
 */
export function ProgressLoaderScreen({ frame, durationMs = 2400, onComplete }: Props) {
  const tint = TINT_COLORS[frame.tint];
  const iconName = ICON_MAP[frame.iconKey];

  const progressAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [displayedPct, setDisplayedPct] = useState(0);

  useEffect(() => {
    const id = progressAnim.addListener(({ value }) => {
      setDisplayedPct(Math.round(value * frame.percent));
    });

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spinLoop.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();

    const t = setTimeout(onComplete, durationMs);

    return () => {
      progressAnim.removeListener(id);
      progressAnim.stopAnimation();
      spinLoop.stop();
      pulseLoop.stop();
      clearTimeout(t);
    };
  }, [frame.percent, durationMs, onComplete, progressAnim, spinAnim, pulseAnim]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${frame.percent}%`],
  });

  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <PenpotFlowShell orbVariant="thinking" contentStyle={styles.content}>
      <View style={styles.center}>
        <View style={[styles.ring, { borderColor: tint.ring }]}>
          <Animated.View
            style={[
              styles.iconBubble,
              { backgroundColor: tint.fill, transform: [{ scale: pulseAnim }] },
            ]}
          >
            <Ionicons name={iconName} size={36} color={Colors.textPrimary} />
          </Animated.View>
        </View>
        <Text style={styles.title}>{frame.title}</Text>
        <Text style={[styles.accent, { color: tint.accent }]}>{frame.accent}</Text>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: barWidth, backgroundColor: tint.track },
            ]}
          />
        </View>
        <Text style={styles.statusLabel}>
          {frame.statusLabel} · {displayedPct}%
        </Text>

        <View style={styles.checklist}>
          {frame.tasks.map((task, i) => (
            <ChecklistRow
              key={i}
              task={task}
              spinRotate={spinRotate}
              spinnerColor={tint.accent}
            />
          ))}
        </View>
      </View>
    </PenpotFlowShell>
  );
}

function ChecklistRow({
  task,
  spinRotate,
  spinnerColor,
}: {
  task: LoaderTask;
  spinRotate: Animated.AnimatedInterpolation<string>;
  spinnerColor: string;
}) {
  if (task.state === 'done') {
    return (
      <View style={styles.row}>
        <Ionicons name="checkmark" size={18} color={Colors.accentHighlight} />
        <Text style={styles.rowDone}>{task.label}</Text>
      </View>
    );
  }
  if (task.state === 'inProgress') {
    return (
      <View style={styles.row}>
        <Animated.View
          style={[
            styles.spinner,
            {
              borderColor: '#FFFFFF26',
              borderTopColor: spinnerColor,
              transform: [{ rotate: spinRotate }],
            },
          ]}
        />
        <Text style={styles.rowActive}>{task.label}</Text>
      </View>
    );
  }
  return (
    <View style={styles.row}>
      <Ionicons name="ellipse-outline" size={18} color={Colors.textTertiary} />
      <Text style={styles.rowPending}>{task.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  center: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxxl,
    gap: Spacing.md,
  },
  ring: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  iconBubble: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 22,
    textAlign: 'center',
  },
  accent: {
    ...Typography.h1,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: -Spacing.xs,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF14',
    overflow: 'hidden',
    marginTop: Spacing.lg,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  statusLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: -Spacing.xs,
  },
  checklist: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowDone: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  rowActive: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  rowPending: {
    ...Typography.body,
    color: Colors.textTertiary,
    fontSize: 14,
  },
  spinner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
});
