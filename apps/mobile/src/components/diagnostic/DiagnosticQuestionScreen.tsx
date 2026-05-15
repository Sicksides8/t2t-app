import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DiagnosticQuestion } from '../../data/diagnostic';
import { Button } from '../ui';
import { PenpotFlowShell, PenpotScaleAnswer, PenpotTopBar } from '../penpot';
import { Colors, Spacing, Typography } from '../../theme';

type Props = {
  question: DiagnosticQuestion;
  questionIndex: number;
  totalQuestions: number;
  progress: number;
  onBack?: () => void;
  onSubmit: (value: number) => void;
};

/** Penpot: 09_Q_* … 23_Q_* — una pantalla por pregunta. */
export function DiagnosticQuestionScreen({
  question,
  questionIndex,
  totalQuestions,
  progress,
  onBack,
  onSubmit,
}: Props) {
  const [selected, setSelected] = useState<number | undefined>();

  return (
    <PenpotFlowShell
      orbVariant="diagnostic"
      contentStyle={styles.content}
      footer={
        <Button
          title="Siguiente"
          disabled={selected == null}
          onPress={() => selected != null && onSubmit(selected)}
        />
      }
    >
      <PenpotTopBar
        title={question.dimensionLabel}
        progress={progress}
        onBack={onBack}
        rightLabel={`${questionIndex + 1}/${totalQuestions}`}
      />
      <View style={styles.body}>
        <Text style={styles.badge}>{question.penFrame.replace(/_/g, ' ')}</Text>
        <Text style={styles.question}>{question.text}</Text>
        <Text style={styles.hint}>Elegí del 1 al 5 según qué tan cierto es hoy para ti.</Text>
        <PenpotScaleAnswer value={selected} onSelect={setSelected} />
      </View>
    </PenpotFlowShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  body: {
    flex: 1,
    paddingTop: Spacing.md,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: Colors.accentHighlight,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  question: {
    ...Typography.h1,
    fontSize: 22,
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  hint: {
    ...Typography.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
});
