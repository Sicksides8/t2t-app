import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../ui';
import { HookIconSelectList } from '../hooks/HookIconSelectList';
import { PenpotFlowShell } from '../penpot';
import {
  EXPERIENCE_LEVEL_OPTIONS,
  EXPERIENCE_LEVEL_SCREEN_COPY,
} from '../../constants/onboardingCopy';
import type { ExperienceLevel } from '../../types';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  initialLevel?: ExperienceLevel | null;
  onNext: (level: ExperienceLevel) => void;
};

export function OnboardingExperienceLevelScreen({ initialLevel, onNext }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    initialLevel ? new Set([initialLevel]) : new Set(['intermediate']),
  );

  const toggle = (id: string) => {
    setSelectedIds(new Set([id]));
  };

  const selectedLevel =
    EXPERIENCE_LEVEL_OPTIONS.find((o) => selectedIds.has(o.id))?.level ?? 'intermediate';

  return (
    <PenpotFlowShell
      orbVariant="diagnostic"
      contentStyle={styles.content}
      footer={
        <Button
          title={EXPERIENCE_LEVEL_SCREEN_COPY.primaryLabel}
          onPress={() => onNext(selectedLevel)}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>{EXPERIENCE_LEVEL_SCREEN_COPY.title}</Text>
        <Text style={styles.subtitle}>{EXPERIENCE_LEVEL_SCREEN_COPY.subtitle}</Text>
      </View>
      <HookIconSelectList
        options={EXPERIENCE_LEVEL_OPTIONS}
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
