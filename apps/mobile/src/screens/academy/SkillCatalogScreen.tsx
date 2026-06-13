import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CourseCard, type CourseFilters } from '../../components/academy';
import { AppBackground } from '../../components/penpot';
import { CourseListSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { skills } from '../../data/academy';
import { fetchCourses } from '../../services/courseService';
import { useAcademyStore } from '../../stores';
import { sameSkillId } from '../../utils/skillId';
import { Colors, Spacing, Typography } from '../../theme';
import type { Course, RootStackParamList } from '../../types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SKILL_ICONS: Record<string, IoniconName> = {
  sparkles: 'sparkles',
  megaphone: 'megaphone-outline',
  'git-branch': 'git-branch-outline',
  chatbubbles: 'chatbubbles-outline',
  timer: 'timer-outline',
  flash: 'flash',
  bulb: 'bulb-outline',
  people: 'people-outline',
  crown: 'ribbon',
};

type Tab = 'all' | 'in-progress';

export function SkillCatalogScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, 'SkillCatalog'>) {
  const { skillId, skillName } = route.params;
  const skill = skills.find((s) => sameSkillId(s.id, skillId));
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters] = useState<CourseFilters>({});
  const [tab, setTab] = useState<Tab>('all');
  const progressMap = useAcademyStore((state) => state.progress);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      // Usamos fetchCourses (API → Web SDK fallback) y filtramos en memoria
      // por skillId con sameSkillId para tolerar diferencias de capitalización
      // o acentos en cursos viejos.
      const all = await fetchCourses();
      if (!cancelled) {
        setCourses(all.filter((c) => sameSkillId(c.skillId, skillId)));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [skillId]);

  const filtered = useMemo(() => {
    let base = [...courses].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    if (filters.maxDurationMin) base = base.filter((c) => c.durationMin <= filters.maxDurationMin!);
    if (filters.plan) {
      base = base.filter((c) => {
        const isPremium = c.isPremium === true;
        if (filters.plan === 'FREE') return !isPremium;
        return isPremium;
      });
    }
    if (tab === 'in-progress') {
      base = base.filter((c) => {
        const pct = progressMap[c.id]?.percentComplete ?? 0;
        return pct > 0 && pct < 100;
      });
    }
    return base;
  }, [courses, filters, progressMap, tab]);

  const title = skillName || skill?.name || 'Catálogo';
  const totalModules = useMemo(
    () => courses.reduce((sum, c) => sum + (c.totalLessons || 0), 0),
    [courses],
  );
  const skillIcon = skill ? SKILL_ICONS[skill.icon] ?? 'ellipse-outline' : 'ellipse-outline';

  return (
    <View style={styles.screen}>
      <AppBackground variant="default" />
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.topRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
              <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.header}>
            <View style={styles.skillTile}>
              <Ionicons
                name={skillIcon}
                size={30}
                color={skill?.color || Colors.accentPrimary}
              />
            </View>
            <View style={styles.headerCol}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>
                {courses.length} {courses.length === 1 ? 'curso' : 'cursos'} · {totalModules} módulos
              </Text>
            </View>
          </View>

          {skill?.description ? <Text style={styles.body}>{skill.description}</Text> : null}

          <View style={styles.tabsRow}>
            <Pressable
              onPress={() => setTab('all')}
              style={[styles.tabChip, tab === 'all' && styles.tabChipActive]}
            >
              <Text style={[styles.tabText, tab === 'all' && styles.tabTextActive]}>Todos</Text>
            </Pressable>
            <Pressable
              onPress={() => setTab('in-progress')}
              style={[styles.tabChip, tab === 'in-progress' && styles.tabChipActive]}
            >
              <Text style={[styles.tabText, tab === 'in-progress' && styles.tabTextActive]}>
                En curso
              </Text>
            </Pressable>
          </View>

          {loading ? <CourseListSkeleton /> : null}
          {!loading && !filtered.length ? (
            <EmptyState title="Sin cursos" message="Pronto habrá más contenido en esta categoría." />
          ) : null}

          {filtered.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progressPercent={progressMap[course.id]?.percentComplete}
              onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF1F',
    borderWidth: 1,
    borderColor: '#FFFFFF2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 20,
  },
  skillTile: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#2A1052',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCol: {
    flex: 1,
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    color: '#C2AAD6',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  body: {
    ...Typography.body,
    color: '#C2AAD6',
    marginTop: 18,
    marginBottom: 18,
    lineHeight: 22,
    fontSize: 14,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  tabChip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#2A1052',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
  },
  tabChipActive: {
    backgroundColor: Colors.accentPrimary,
    borderColor: Colors.accentPrimary,
  },
  tabText: {
    color: '#C2AAD6',
    fontWeight: '700',
    fontSize: 13,
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
});
