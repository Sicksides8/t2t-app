import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Chip } from '../ui';
import { Colors, Radius, Spacing, Typography } from '../../theme';
import type { Course } from '../../types';

export type CourseFilters = {
  level?: Course['level'];
  maxDurationMin?: number;
  onlyNotStarted?: boolean;
};

type Props = {
  visible: boolean;
  filters: CourseFilters;
  onApply: (filters: CourseFilters) => void;
  onClose: () => void;
};

const LEVELS: { id: Course['level']; label: string }[] = [
  { id: 'beginner', label: 'Principiante' },
  { id: 'intermediate', label: 'Intermedio' },
  { id: 'advanced', label: 'Avanzado' },
];

const DURATIONS = [
  { id: 30, label: 'Hasta 30 min' },
  { id: 60, label: 'Hasta 60 min' },
  { id: 120, label: 'Hasta 2 h' },
];

export function CourseFiltersSheet({ visible, filters, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<CourseFilters>(filters);

  const reset = () => {
    const empty: CourseFilters = {};
    setDraft(empty);
    onApply(empty);
    onClose();
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Filtros</Text>
          <Text style={styles.section}>Nivel</Text>
          <View style={styles.chips}>
            {LEVELS.map((lvl) => (
              <Pressable key={lvl.id} onPress={() => setDraft((d) => ({ ...d, level: d.level === lvl.id ? undefined : lvl.id }))}>
                <Chip label={lvl.label} active={draft.level === lvl.id} />
              </Pressable>
            ))}
          </View>
          <Text style={styles.section}>Duración</Text>
          <View style={styles.chips}>
            {DURATIONS.map((dur) => (
              <Pressable
                key={dur.id}
                onPress={() =>
                  setDraft((d) => ({
                    ...d,
                    maxDurationMin: d.maxDurationMin === dur.id ? undefined : dur.id,
                  }))
                }
              >
                <Chip label={dur.label} active={draft.maxDurationMin === dur.id} />
              </Pressable>
            ))}
          </View>
          <Pressable
            onPress={() => setDraft((d) => ({ ...d, onlyNotStarted: !d.onlyNotStarted }))}
            style={styles.toggleRow}
          >
            <Chip label="Solo no iniciados" active={Boolean(draft.onlyNotStarted)} />
          </Pressable>
          <Button title="Aplicar" onPress={() => { onApply(draft); onClose(); }} />
          <Button title="Limpiar" variant="ghost" onPress={reset} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.cardLg,
    borderTopRightRadius: Radius.cardLg,
    padding: Spacing.xl,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.divider,
    gap: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
  },
  section: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  toggleRow: {
    alignSelf: 'flex-start',
  },
});
