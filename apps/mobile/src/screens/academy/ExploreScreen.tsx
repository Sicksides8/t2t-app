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
import { ExploreChip } from '../../components/explore';
import { ScreenWrapper, TAB_SCREEN_EDGES } from '../../components/ui';
import { CourseListSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { skills as seedSkills } from '../../data/academy';
import { getCourses, getRecommendedCourses, getSkills } from '../../services/academyService';
import type { Skill } from '../../types';
import { useAcademyStore, useAuthStore, useCourseStore } from '../../stores';
import { humanizeSkillId, normalizeSkillId, sameSkillId } from '../../utils/skillId';
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
  const loading = useCourseStore((state) => state.loading);

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
      const baseSkills = remoteSkills.length ? remoteSkills : seedSkills;

      // Sumamos al catálogo cualquier skill que aparezca en los cursos cargados
      // pero que no esté en el catálogo estático/remoto. Así un curso creado
      // desde el CRM con habilidad nueva (ej. "marketing") muestra su chip y
      // su categoría aunque la skill no esté declarada.
      const knownIds = new Set(baseSkills.map((s) => normalizeSkillId(s.id)));
      const extras: Skill[] = [];
      for (const course of remoteCourses) {
        const normalized = normalizeSkillId(course.skillId);
        if (!normalized || knownIds.has(normalized)) continue;
        knownIds.add(normalized);
        extras.push({
          id: normalized,
          name: humanizeSkillId(normalized) || normalized,
          description: 'Habilidad disponible en el catálogo',
          icon: 'sparkles',
          color: '#7C7CFF',
          order: baseSkills.length + extras.length + 1,
        });
      }
      const skillsList = [...baseSkills, ...extras];
      setCatalogSkills(skillsList);
      setAllCourses(remoteCourses);

      const next: Record<string, number> = {};
      for (const skill of skillsList) {
        next[skill.id] = remoteCourses.filter((c) => sameSkillId(c.skillId, skill.id)).length;
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
      setRecommended([]);
      return;
    }
    void getRecommendedCourses(user.id, diagnostic.topSkills).then((list) => {
      setRecommended(list);
    });
  }, [user?.id, diagnostic.topSkills]);

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

  const skillNameById = useMemo(
    () => Object.fromEntries(catalogSkills.map((s) => [s.id, s.name])) as Record<string, string>,
    [catalogSkills],
  );

  const isForYou = activeChip === ALL_SKILL_ID;

  const forYouCourses = useMemo(() => {
    let base = isForYou
      ? recommended
      : allCourses.filter((c) => sameSkillId(c.skillId, activeChip));

    if (normalizedQuery) {
      base = base.filter(
        (c) =>
          c.title.toLowerCase().includes(normalizedQuery) ||
          c.description?.toLowerCase().includes(normalizedQuery),
      );
    }

    if (filters.maxDurationMin) base = base.filter((c) => c.durationMin <= filters.maxDurationMin!);
    if (filters.plan) {
      base = base.filter((c) => {
        const isPremium = c.isPremium === true;
        if (filters.plan === 'FREE') return !isPremium;
        if (filters.plan === 'PRO') return isPremium; // PRO -> incluye premium
        return isPremium; // MASTER -> incluye premium también (futura granularidad)
      });
    }

    return base.slice(0, 12);
  }, [activeChip, allCourses, filters, isForYou, normalizedQuery, recommended]);

  const hasDiagnostic = diagnostic.topSkills.length > 0;

  const forYouSubtitle = useMemo(() => {
    if (!isForYou || !hasDiagnostic) return null;
    const names = diagnostic.topSkills
      .slice(0, 2)
      .map((id) => skillNameById[id])
      .filter(Boolean) as string[];
    if (!names.length) return null;
    return `Basado en ${names.join(' · ')}`;
  }, [diagnostic.topSkills, hasDiagnostic, isForYou, skillNameById]);

  const openCatalog = (skillId: string, skillName: string) => {
    setActiveChip(skillId);
    navigation.navigate('SkillCatalog', { skillId, skillName });
  };

  const hasActiveFilters = Boolean(filters.maxDurationMin || filters.plan);

  return (
    <ScreenWrapper scroll edges={TAB_SCREEN_EDGES} contentStyle={styles.screen}>
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

      {loading && !forYouCourses.length ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Para ti</Text>
          <CourseListSkeleton />
        </View>
      ) : forYouCourses.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Para ti</Text>
          {forYouSubtitle ? <Text style={styles.sectionSubtitle}>{forYouSubtitle}</Text> : null}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recRow}
          >
            {forYouCourses.map((course) => (
              <ExploreCourseTile
                key={course.id}
                course={course}
                width={180}
                matchSkillName={
                  isForYou && hasDiagnostic ? skillNameById[course.skillId] : undefined
                }
                onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <CourseFiltersSheet
        visible={filterOpen}
        filters={filters}
        resultCount={forYouCourses.length}
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
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: '#1F0A40',
    borderWidth: 1,
    borderColor: Colors.divider,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 0,
  },
  chipsScroll: {
    flexGrow: 0,
    marginHorizontal: -Spacing.xl,
    marginBottom: 14,
  },
  chipsRow: {
    paddingHorizontal: Spacing.xl,
    gap: 8,
    alignItems: 'center',
  },
  section: {
    gap: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textTertiary,
    marginTop: -4,
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
