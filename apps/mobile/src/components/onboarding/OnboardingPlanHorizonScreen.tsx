import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui';
import { HookIconSelectList } from '../hooks/HookIconSelectList';
import { PenpotFlowShell } from '../penpot';
import {
  HORIZON_OPTIONS,
  HORIZON_SCREEN_COPY,
} from '../../constants/onboardingCopy';
import type { PlanHorizonDays } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  initialDays?: PlanHorizonDays | null;
  onNext: (days: PlanHorizonDays) => void;
};

export function OnboardingPlanHorizonScreen({ initialDays = 60, onNext }: Props) {
  const defaultId = String(initialDays ?? 60);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set([defaultId]));

  const toggle = (id: string) => {
    setSelectedIds(new Set([id]));
  };

  const selectedDays = HORIZON_OPTIONS.find((o) => selectedIds.has(o.id))?.days ?? 60;

  return (
    <PenpotFlowShell
      orbVariant="diagnostic"
      contentStyle={styles.content}
      footer={<Button title={HORIZON_SCREEN_COPY.primaryLabel} onPress={() => onNext(selectedDays)} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{HORIZON_SCREEN_COPY.title}</Text>
        <Text style={styles.subtitle}>{HORIZON_SCREEN_COPY.subtitle}</Text>
      </View>
      <HookIconSelectList
        options={HORIZON_OPTIONS}
        selectedIds={selectedIds}
        onToggle={toggle}
      />
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: Spacing.lg,
    gap: Spacing.xl,
  },
  header: {
    gap: Spacing.sm,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
  },
});
