import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PenpotFlowShell } from '../penpot';
import { Button } from '../ui';
import type { DiagnosticOption, DiagnosticQuestion } from '../../data/diagnostic';
import { Colors, Radius, Spacing, Typography } from '../../theme';

type Props = {
  question: DiagnosticQuestion;
  questionIndex: number;
  totalQuestions: number;
  onBack?: () => void;
  onSubmit: (value: number) => void;
};

/**
 * Penpot 11..30 (Q1..Q14). Top bar back + counter + barra progreso verde,
 * label categoría verde, pregunta hero, lista de radio cards (5 ó 6 opciones).
 */
export function DiagnosticQuestionScreen({
  question,
  questionIndex,
  totalQuestions,
  onBack,
  onSubmit,
}: Props) {
  const [selected, setSelected] = useState<number | undefined>();
  const progressPct = ((questionIndex + 1) / totalQuestions) * 100;
  const primaryLabel = question.primaryLabel ?? 'Continuar';

  return (
    <PenpotFlowShell
      orbVariant="diagnostic"
      contentStyle={styles.content}
      footer={
        <Button
          title={primaryLabel}
          disabled={selected == null}
          onPress={() => selected != null && onSubmit(selected)}
        />
      }
    >
      <View style={styles.topRow}>
        {onBack ? (
          <Pressable style={styles.backBtn} onPress={onBack} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}
        <Text style={styles.counter}>
          {questionIndex + 1}/{totalQuestions}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>

      {question.hint ? <Text style={styles.hint}>{question.hint}</Text> : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.category}>{question.category}</Text>
        <Text style={styles.question}>{question.text}</Text>

        <View style={styles.options}>
          {question.options.map((option) => (
            <OptionCard
              key={option.value}
              option={option}
              selected={selected === option.value}
              onPress={() => setSelected(option.value)}
            />
          ))}
        </View>
      </ScrollView>
    </PenpotFlowShell>
  );
}

function OptionCard({
  option,
  selected,
  onPress,
}: {
  option: DiagnosticOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioInner} /> : null}
      </View>
      <Text style={[styles.optionText, selected && styles.optionTextSelected]} numberOfLines={3}>
        {option.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  backPlaceholder: {
    width: 40,
    height: 40,
  },
  counter: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF14',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accentHighlight,
    borderRadius: 2,
  },
  hint: {
    ...Typography.caption,
    color: Colors.accentHighlight,
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  scroll: {
    flex: 1,
    marginTop: Spacing.md,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  category: {
    ...Typography.caption,
    color: Colors.accentHighlight,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 1.4,
  },
  question: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 24,
    lineHeight: 30,
    marginTop: Spacing.sm,
  },
  options: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderRadius: Radius.card,
    backgroundColor: '#FFFFFF0F',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    minHeight: 56,
  },
  optionSelected: {
    backgroundColor: '#B73CEF26',
    borderColor: Colors.accentPrimary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFFFFF40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: Colors.accentPrimary,
    backgroundColor: Colors.accentPrimary,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textPrimary,
  },
  optionText: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
});
