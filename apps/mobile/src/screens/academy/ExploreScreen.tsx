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
import { getRecommendedCourses, getSkills } from '../../services/academyService';
import { fetchCourses } from '../../services/courseService';
import type { Skill } from '../../types';
import { useAcademyStore, useAuthStore, useCourseStore } from '../../stores';
import {
  buildExploreCatalogSkills,
  buildSkillCountMap,
  courseMatchesSkill,
  skillsForCategoryGrid,
} from '../../utils/skillCatalog';
import { canAccessCourse, getRequiredPlan } from '../../utils/subscriptionAccess';
import { Colors, Spacing, Typography } from '../../theme';
import type { Course, RootStackParamList } from '../../types';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

const ALL_SKILL_ID = '__all__';
/** Categorías con ícono visibles antes de expandir. */
const CATEGORY_PREVIEW_COUNT = 6;

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
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  useEffect(() => {
    void (async () => {
      // Usamos fetchCourses (que va por /api/courses con fallback al SDK)
      // en vez de getCourses directo. Así dependemos del endpoint público
      // del CRM y no del orderBy del Web SDK que requiere índice compuesto.
      const [remoteSkills, remoteCourses] = await Promise.all([getSkills(), fetchCourses()]);
      const skillsList = buildExploreCatalogSkills(
        remoteSkills.length ? remoteSkills : seedSkills,
        remoteCourses,
      );
      setCatalogSkills(skillsList);
      setAllCourses(remoteCourses);
      setCounts(buildSkillCountMap(skillsList, remoteCourses));
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

  const gridSkills = useMemo(
    () => skillsForCategoryGrid(catalogSkills, counts),
    [catalogSkills, counts],
  );

  const chipSkills = gridSkills;

  const visibleSkills = useMemo(() => {
    let list = activeChip === ALL_SKILL_ID ? gridSkills : gridSkills.filter((s) => s.id === activeChip);

    if (normalizedQuery) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(normalizedQuery) ||
          s.description.toLowerCase().includes(normalizedQuery),
      );
    }

    return list;
  }, [activeChip, gridSkills, normalizedQuery]);

  const displayedCategorySkills = useMemo(() => {
    if (normalizedQuery || categoriesExpanded || visibleSkills.length <= CATEGORY_PREVIEW_COUNT) {
      return visibleSkills;
    }
    return visibleSkills.slice(0, CATEGORY_PREVIEW_COUNT);
  }, [visibleSkills, categoriesExpanded, normalizedQuery]);

  const hiddenCategoryCount = Math.max(0, visibleSkills.length - CATEGORY_PREVIEW_COUNT);
  const canExpandCategories =
    !normalizedQuery && !categoriesExpanded && hiddenCategoryCount > 0;
  const canCollapseCategories =
    !normalizedQuery && categoriesExpanded && visibleSkills.length > CATEGORY_PREVIEW_COUNT;

  const categoryRows = useMemo(
    () => chunkSkills(displayedCategorySkills, 2),
    [displayedCategorySkills],
  );

  const skillNameById = useMemo(
    () => Object.fromEntries(catalogSkills.map((s) => [s.id, s.name])) as Record<string, string>,
    [catalogSkills],
  );

  const isForYou = activeChip === ALL_SKILL_ID;

  const forYouCourses = useMemo(() => {
    let base = isForYou
      ? recommended
      : allCourses.filter((c) => courseMatchesSkill(c.skillId, activeChip));

    if (normalizedQuery) {
      base = base.filter(
        (c) =>
          c.title.toLowerCase().includes(normalizedQuery) ||
          c.description?.toLowerCase().includes(normalizedQuery),
      );
    }

    if (filters.maxDurationMin) base = base.filter((c) => c.durationMin <= filters.maxDurationMin!);
    if (filters.plan) {
      // Filtramos contra el plan canónico requerido del curso (deriva de
      // accessTier; isPremium queda como fallback). FREE/PRO/ELITE matchean
      // exactamente el tier del curso.
      base = base.filter((c) => {
        const required = getRequiredPlan(c);
        if (filters.plan === 'FREE') return required === 'free';
        if (filters.plan === 'PRO') return required === 'pro';
        return required === 'elite';
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
    if ((counts[skillId] ?? 0) <= 0) return;
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
        {chipSkills.map((skill) => (
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

        {canExpandCategories ? (
          <Pressable
            onPress={() => setCategoriesExpanded(true)}
            style={({ pressed }) => [styles.moreCategoriesBtn, pressed && styles.moreCategoriesBtnPressed]}
            hitSlop={6}
          >
            <Text style={styles.moreCategoriesText}>
              Ver más categorías ({hiddenCategoryCount})
            </Text>
            <Ionicons name="chevron-down" size={18} color={Colors.accentPrimary} />
          </Pressable>
        ) : null}

        {canCollapseCategories ? (
          <Pressable
            onPress={() => setCategoriesExpanded(false)}
            style={({ pressed }) => [styles.moreCategoriesBtn, pressed && styles.moreCategoriesBtnPressed]}
            hitSlop={6}
          >
            <Text style={styles.moreCategoriesText}>Ver menos categorías</Text>
            <Ionicons name="chevron-up" size={18} color={Colors.accentPrimary} />
          </Pressable>
        ) : null}

        {visibleSkills.length === 0 && activeChip === ALL_SKILL_ID && !normalizedQuery ? (
          <EmptyState
            title="Sin categorías con cursos"
            message="Cuando haya cursos publicados en el CRM, van a aparecer acá."
            icon="library-outline"
          />
        ) : null}

        {visibleSkills.length === 0 && (activeChip !== ALL_SKILL_ID || normalizedQuery) ? (
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
                locked={!canAccessCourse(course, user)}
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
  moreCategoriesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 2,
  },
  moreCategoriesBtnPressed: {
    opacity: 0.85,
  },
  moreCategoriesText: {
    color: Colors.accentPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  recRow: {
    gap: 10,
    paddingBottom: Spacing.xl,
  },
});
