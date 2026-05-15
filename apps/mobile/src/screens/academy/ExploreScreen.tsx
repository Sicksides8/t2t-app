import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  CategoryGridCard,
  CourseFiltersSheet,
  ExploreCourseTile,
  type CourseFilters,
} from '../../components/academy';
import { ExploreChip, ExploreOrbs } from '../../components/explore';
import { ScreenWrapper, TAB_SCREEN_EDGES } from '../../components/ui';
import { CourseListSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { courses as seedCourses, skills as seedSkills } from '../../data/academy';
import { getCourses, getRecommendedCourses, getSkills } from '../../services/academyService';
import type { Skill } from '../../types';
import { useAcademyStore, useAuthStore, useCourseStore } from '../../stores';
import { Colors, Spacing, Typography } from '../../theme';
import type { Course, RootStackParamList } from '../../types';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

const ALL_SKILL_ID = '__all__';

function chunkSkills<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

export function ExploreScreen() {
  const navigation = useNavigation<RootNav>();
  const user = useAuthStore((state) => state.user);
  const diagnostic = useAcademyStore((state) => state.diagnostic);
  const loadCourses = useCourseStore((state) => state.load);
  const storeCourses = useCourseStore((state) => state.courses);
  const loading = useCourseStore((state) => state.loading);
  const progressMap = useAcademyStore((state) => state.progress);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState<string>(ALL_SKILL_ID);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<CourseFilters>({});
  const [catalogSkills, setCatalogSkills] = useState<Skill[]>(seedSkills);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recommended, setRecommended] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);

  useEffect(() => {
    void (async () => {
      const [remoteSkills, remoteCourses] = await Promise.all([getSkills(), getCourses()]);
      const skillsList = remoteSkills.length ? remoteSkills : seedSkills;
      const coursesList = remoteCourses.length ? remoteCourses : seedCourses;
      setCatalogSkills(skillsList);
      setAllCourses(coursesList);

      const next: Record<string, number> = {};
      for (const skill of skillsList) {
        next[skill.id] = coursesList.filter((c) => c.skillId === skill.id).length;
      }
      setCounts(next);
    })();
  }, []);

  useEffect(() => {
    const skillFilter = activeChip === ALL_SKILL_ID ? undefined : activeChip;
    void loadCourses(skillFilter);
  }, [activeChip, loadCourses]);

  useEffect(() => {
    if (!user?.id) {
      setRecommended(storeCourses.length ? storeCourses.slice(0, 8) : seedCourses.slice(0, 8));
      return;
    }
    void getRecommendedCourses(user.id, diagnostic.topSkills).then((list) => {
      setRecommended(list.length ? list : seedCourses.slice(0, 8));
    });
  }, [user?.id, diagnostic.topSkills, storeCourses]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const visibleSkills = useMemo(() => {
    let list = catalogSkills;

    if (activeChip !== ALL_SKILL_ID) {
      list = list.filter((s) => s.id === activeChip);
    }

    if (normalizedQuery) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(normalizedQuery) ||
          s.description.toLowerCase().includes(normalizedQuery),
      );
    }

    return list;
  }, [activeChip, catalogSkills, normalizedQuery]);

  const categoryRows = useMemo(() => chunkSkills(visibleSkills, 2), [visibleSkills]);

  const forYouCourses = useMemo(() => {
    let base =
      activeChip !== ALL_SKILL_ID
        ? allCourses.filter((c) => c.skillId === activeChip)
        : recommended.length
          ? recommended
          : allCourses.length
            ? allCourses
            : storeCourses.length
              ? storeCourses
              : seedCourses;

    if (normalizedQuery) {
      base = base.filter(
        (c) =>
          c.title.toLowerCase().includes(normalizedQuery) ||
          c.description?.toLowerCase().includes(normalizedQuery),
      );
    }

    if (filters.level) base = base.filter((c) => c.level === filters.level);
    if (filters.maxDurationMin) base = base.filter((c) => c.durationMin <= filters.maxDurationMin!);
    if (filters.onlyNotStarted) {
      base = base.filter((c) => !(progressMap[c.id]?.percentComplete > 0));
    }

    return base.slice(0, 12);
  }, [activeChip, allCourses, filters, normalizedQuery, progressMap, recommended, storeCourses]);

  const openCatalog = (skillId: string, skillName: string) => {
    setActiveChip(skillId);
    navigation.navigate('SkillCatalog', { skillId, skillName });
  };

  const hasActiveFilters = Boolean(filters.level || filters.maxDurationMin || filters.onlyNotStarted);

  return (
    <ScreenWrapper scroll edges={TAB_SCREEN_EDGES} contentStyle={styles.screen}>
      <ExploreOrbs />

      <Text style={styles.title}>Explorar</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textTertiary} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar habilidades, módulos…"
          placeholderTextColor={Colors.textTertiary}
          style={styles.searchInput}
          selectionColor={Colors.accentPrimary}
          returnKeyType="search"
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        <ExploreChip label="Todos" active={activeChip === ALL_SKILL_ID} onPress={() => setActiveChip(ALL_SKILL_ID)} />
        {catalogSkills.map((skill) => (
          <ExploreChip
            key={skill.id}
            label={skill.name}
            active={activeChip === skill.id}
            onPress={() => setActiveChip(skill.id)}
          />
        ))}
        <ExploreChip
          label="Filtros"
          icon="options-outline"
          active={hasActiveFilters}
          onPress={() => setFilterOpen(true)}
        />
      </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {activeChip === ALL_SKILL_ID ? 'Categorías' : catalogSkills.find((s) => s.id === activeChip)?.name ?? 'Categoría'}
        </Text>

        {categoryRows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.catRow}>
            {row.map((skill) => (
              <CategoryGridCard
                key={skill.id}
                skill={skill}
                courseCount={counts[skill.id] ?? 0}
                fullWidth={row.length === 1}
                onPress={() => openCatalog(skill.id, skill.name)}
              />
            ))}
          </View>
        ))}

        {visibleSkills.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            message="Probá otro término de búsqueda."
            icon="search-outline"
          />
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Para vos</Text>
        {loading && !forYouCourses.length ? <CourseListSkeleton /> : null}
        {!loading && !forYouCourses.length ? (
          <EmptyState
            title="Nada para mostrar"
            message="Ajustá los filtros o explorá otra categoría."
            icon="book-outline"
          />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recRow}
          >
            {forYouCourses.map((course) => (
              <ExploreCourseTile
                key={course.id}
                course={course}
                width={170}
                onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <CourseFiltersSheet
        visible={filterOpen}
        filters={filters}
        onApply={setFilters}
        onClose={() => setFilterOpen(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'relative',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
    color: Colors.textPrimary,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Colors.bgSurface,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },
  chipsScroll: {
    marginHorizontal: -Spacing.xl,
    marginBottom: 12,
  },
  chipsRow: {
    paddingHorizontal: Spacing.xl,
    gap: 8,
    alignItems: 'center',
  },
  section: {
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  catRow: {
    flexDirection: 'row',
    gap: 10,
  },
  recRow: {
    gap: 10,
    paddingBottom: Spacing.xl,
  },
});
