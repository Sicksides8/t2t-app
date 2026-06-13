import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing } from '../../theme';
import { Button } from '../ui';

const { height: SCREEN_H } = Dimensions.get('window');

export type CourseDurationBucket = 5 | 15 | 30;
export type CoursePlanFilter = 'FREE' | 'PRO' | 'ELITE';

export type CourseFilters = {
  maxDurationMin?: CourseDurationBucket;
  plan?: CoursePlanFilter;
};

type Props = {
  visible: boolean;
  filters: CourseFilters;
  resultCount?: number;
  onApply: (filters: CourseFilters) => void;
  onClose: () => void;
};

const DURATIONS: { id: CourseDurationBucket; label: string }[] = [
  { id: 5, label: '< 5 min' },
  { id: 15, label: '5 - 15 min' },
  { id: 30, label: '15 - 30 min' },
];

const PLANS: { id: CoursePlanFilter; label: string }[] = [
  { id: 'FREE', label: 'FREE' },
  { id: 'PRO', label: 'PRO' },
  { id: 'ELITE', label: 'ELITE' },
];

export function CourseFiltersSheet({ visible, filters, resultCount, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<CourseFilters>(filters);

  useEffect(() => {
    setDraft(filters);
  }, [filters, visible]);

  const clear = () => {
    const empty: CourseFilters = {};
    setDraft(empty);
    onApply(empty);
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.titleRow}>
            <Text style={styles.title}>Filtros</Text>
            <Pressable onPress={clear} hitSlop={8} accessibilityRole="button">
              <Text style={styles.clear}>Limpiar</Text>
            </Pressable>
          </View>

          <Text style={styles.section}>DURACIÓN</Text>
          <View style={styles.chips}>
            {DURATIONS.map((d) => {
              const active = draft.maxDurationMin === d.id;
              return (
                <Pressable
                  key={d.id}
                  onPress={() =>
                    setDraft((prev) => ({
                      ...prev,
                      maxDurationMin: prev.maxDurationMin === d.id ? undefined : d.id,
                    }))
                  }
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.section}>PLAN</Text>
          <View style={styles.chips}>
            {PLANS.map((p) => {
              const active = draft.plan === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() =>
                    setDraft((prev) => ({
                      ...prev,
                      plan: prev.plan === p.id ? undefined : p.id,
                    }))
                  }
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.applyWrap}>
            <Button
              title={
                typeof resultCount === 'number'
                  ? `Aplicar (${resultCount} resultados)`
                  : 'Aplicar'
              }
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: SCREEN_H * 0.7,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    backgroundColor: '#2A1052',
    borderTopWidth: 1,
    borderColor: '#FFFFFF14',
    gap: 14,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#FFFFFF40',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  clear: {
    color: '#D456FF',
    fontWeight: '700',
    fontSize: 14,
  },
  section: {
    color: '#9B7BB8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 8,
    marginBottom: 4,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: '#3A1872',
  },
  chipActive: {
    backgroundColor: '#D456FF',
    shadowColor: '#D456FF',
    shadowOpacity: 0.55,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  chipText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  applyWrap: {
    marginTop: 16,
    shadowColor: '#D456FF',
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
