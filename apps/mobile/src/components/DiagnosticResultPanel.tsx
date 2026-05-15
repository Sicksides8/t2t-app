import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { computeDiagnosticScores } from '../data/diagnostic';
import type { DiagnosticResult } from '../types';
import { categorizeDiagnosticScores } from '../utils/diagnosticBuckets';
import { Colors, Spacing } from '../theme';
import { Button } from './ui';
import {
  DiagnosticIntro,
  DiagnosticSectionHeader,
  DiagnosticSkillRow,
  DiagnosticStatTiles,
} from './diagnostic';

type Props = {
  diagnostic: DiagnosticResult;
  onViewPlan?: () => void;
  /** Dentro del carrusel onboarding: sin CTA duplicado. */
  embedded?: boolean;
};

function sortByScore(ids: string[], scores: Record<string, number>) {
  return [...ids].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));
}

export function DiagnosticResultPanel({ diagnostic, onViewPlan, embedded }: Props) {
  const { scores } = useMemo(() => computeDiagnosticScores(diagnostic.answers), [diagnostic.answers]);

  const buckets = useMemo(() => {
    const base = categorizeDiagnosticScores(scores);
    return {
      strength: sortByScore(base.strength, scores),
      developing: sortByScore(base.developing, scores),
      train: sortByScore(base.train, scores),
    };
  }, [scores]);

  return (
    <View style={styles.wrap}>
      <DiagnosticIntro />
      <DiagnosticStatTiles
        strengths={buckets.strength.length}
        developing={buckets.developing.length}
        train={buckets.train.length}
      />

      {buckets.strength.length > 0 ? (
        <>
          <DiagnosticSectionHeader label="FORTALEZAS" dotColor={Colors.accentHighlight} />
          {buckets.strength.map((id) => (
            <DiagnosticSkillRow key={id} skillId={id} score={scores[id] ?? 0} bucket="strength" />
          ))}
        </>
      ) : null}

      {buckets.developing.length > 0 ? (
        <>
          <DiagnosticSectionHeader label="EN DESARROLLO" dotColor={Colors.accentPrimary} />
          {buckets.developing.map((id) => (
            <DiagnosticSkillRow key={id} skillId={id} score={scores[id] ?? 0} bucket="developing" />
          ))}
        </>
      ) : null}

      {buckets.train.length > 0 ? (
        <>
          <DiagnosticSectionHeader label="A ENTRENAR" dotColor={Colors.warning} />
          {buckets.train.map((id) => (
            <DiagnosticSkillRow key={id} skillId={id} score={scores[id] ?? 0} bucket="train" />
          ))}
        </>
      ) : null}

      {!embedded && onViewPlan ? (
        <Button title="Ver mi plan de entrenamiento" onPress={onViewPlan} style={styles.cta} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
    paddingBottom: Spacing.xl,
  },
  cta: {
    marginTop: Spacing.sm,
  },
});
