import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { navigateToExploreTab } from '../../navigation/tabNavigation';
import { MyCourseRow, MyCoursesTabPill } from '../../components/my-courses';
import { ScreenWrapper, TAB_SCREEN_EDGES } from '../../components/ui';
import { EmptyState } from '../../components/ui/EmptyState';
import { useAcademyStore, useAuthStore, useCourseStore } from '../../stores';
import { canAccessCourse } from '../../utils/subscriptionAccess';
import { Colors, Spacing } from '../../theme';
import type { MainTabParamList, RootStackParamList } from '../../types';

type MyCoursesNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'MyCoursesTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Tab = 'in_progress' | 'completed';

export function MyCoursesScreen() {
  const navigation = useNavigation<MyCoursesNav>();
  const loadCourses = useCourseStore((state) => state.load);
  const storeCourses = useCourseStore((state) => state.courses);
  const progressMap = useAcademyStore((state) => state.progress);
  const user = useAuthStore((state) => state.user);
  const [tab, setTab] = useState<Tab>('in_progress');

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const allCourses = storeCourses;

  const lists = useMemo(() => {
    const inProgress: typeof allCourses = [];
    const completed: typeof allCourses = [];

    for (const course of allCourses) {
      const pct = progressMap[course.id]?.percentComplete ?? 0;
      if (pct >= 100) completed.push(course);
      else if (pct > 0) inProgress.push(course);
    }

    return { in_progress: inProgress, completed };
  }, [allCourses, progressMap]);

  const activeList = lists[tab];

  const openCourse = (courseId: string) => {
    navigation.navigate('CourseDetail', { courseId });
  };

  return (
    <ScreenWrapper scroll edges={TAB_SCREEN_EDGES} contentStyle={styles.screen}>
      <Text style={styles.title}>Mis cursos</Text>

      <View style={styles.tabs}>
        <MyCoursesTabPill
          label="En curso"
          count={lists.in_progress.length}
          active={tab === 'in_progress'}
          onPress={() => setTab('in_progress')}
        />
        <MyCoursesTabPill
          label="Completados"
          count={lists.completed.length}
          active={tab === 'completed'}
          onPress={() => setTab('completed')}
        />
      </View>

      {!activeList.length ? (
        <EmptyState
          title={tab === 'in_progress' ? 'Nada en curso' : 'Aún sin completar'}
          message={
            tab === 'in_progress'
              ? 'Empezá un curso desde Explorar o Home.'
              : 'Completá todos los módulos de un curso para verlo aquí.'
          }
          actionLabel={tab === 'in_progress' ? 'Explorar cursos' : undefined}
          onAction={tab === 'in_progress' ? () => navigateToExploreTab(navigation) : undefined}
        />
      ) : (
        activeList.map((course) => {
          const pct = progressMap[course.id]?.percentComplete ?? 0;
          return (
            <MyCourseRow
              key={course.id}
              course={course}
              progressPercent={pct}
              completed={tab === 'completed'}
              locked={!canAccessCourse(course, user)}
              onContinue={() => openCourse(course.id)}
            />
          );
        })
      )}
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
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
});
