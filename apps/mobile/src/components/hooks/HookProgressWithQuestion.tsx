import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography } from '../../theme';

const BAR_ANIMATION_MS = 1400;

type Props = {
  title: string;
  subtitle?: string;
  tasks: string[];
  activeIndex: number;
  question: { preScript: string; text: string; yesLabel?: string; noLabel?: string };
  onAnswer: (value: 'yes' | 'no') => void;
  showQuestion: boolean;
  footnote?: string;
};

function TaskBarRow({
  label,
  targetFill,
  done,
  active,
}: {
  label: string;
  targetFill: number;
  done: boolean;
  active: boolean;
}) {
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: targetFill,
      duration: BAR_ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [targetFill, fillAnim]);

  const barWidth = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.taskRow}>
      <View style={styles.taskHead}>
        <Text style={styles.taskLabel}>{label}</Text>
        {done ? (
          <Ionicons name="checkmark-circle" size={22} color={Colors.accentHighlight} />
        ) : active ? (
          <View style={styles.spinnerDot} />
        ) : null}
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, { width: barWidth }]} />
      </View>
    </View>
  );
}

export function HookProgressWithQuestion({
  title,
  subtitle,
  tasks,
  activeIndex,
  question,
  onAnswer,
  showQuestion,
  footnote,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      <View style={styles.tasks}>
        {tasks.map((task, idx) => {
          const done = idx < activeIndex;
          const active = idx === activeIndex;
          const targetFill = done ? 1 : active ? 0.55 : 0.08;
          return (
            <TaskBarRow
              key={task}
              label={task}
              targetFill={targetFill}
              done={done}
              active={active}
            />
          );
        })}
      </View>

      {showQuestion ? (
        <View style={styles.questionCard}>
          <Text style={styles.preScript}>{question.preScript}</Text>
          <Text style={styles.question}>{question.text}</Text>
          <View style={styles.answers}>
            <Pressable
              style={[styles.answer, styles.answerYes]}
              onPress={() => onAnswer('yes')}
              accessibilityRole="button"
            >
              <Text style={styles.answerText}>{question.yesLabel || 'Sí'}</Text>
            </Pressable>
            <Pressable
              style={[styles.answer, styles.answerNo]}
              onPress={() => onAnswer('no')}
              accessibilityRole="button"
            >
              <Text style={styles.answerText}>{question.noLabel || 'No'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {showQuestion && footnote ? <Text style={styles.footnote}>{footnote}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 20,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: -10,
  },
  tasks: {
    gap: 18,
    marginTop: 8,
  },
  taskRow: {
    gap: 8,
  },
  taskHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  spinnerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.accentHighlight,
  },
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF14',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.accentHighlight,
  },
  questionCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#1F0A40CC',
    borderWidth: 1,
    borderColor: '#FFFFFF1A',
    gap: 12,
  },
  preScript: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 12,
  },
  question: {
    ...Typography.h2,
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
  },
  answers: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  answer: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF12',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
  },
  answerYes: {},
  answerNo: {},
  answerText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  footnote: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    textAlign: 'center',
  },
});
