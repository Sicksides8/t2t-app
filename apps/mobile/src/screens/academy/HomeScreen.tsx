import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { navigateToExploreTab } from '../../navigation/tabNavigation';
import { SectionHeader } from '../../components/academy';
import {
  ContinueCourseCard,
  HomeHeader,
  HomeOrbs,
  HomeSkillChip,
  HomeStreakCard,
  HomeTodayHero,
} from '../../components/home';
import { ScreenWrapper, TAB_SCREEN_EDGES } from '../../components/ui';
import { CourseListSkeleton } from '../../components/ui/Skeleton';
import { courses as seedCourses, lessons as seedLessons, skills } from '../../data/academy';
import { getLessons, getRecommendedCourses } from '../../services/academyService';
import { useAcademyStore, useAuthStore, useCourseStore, useNotificationStore } from '../../stores';
import { Spacing } from '../../theme';
import { computeProfileStats } from '../../utils/profileStats';
import { formatHeroMeta, pickHeroCourse, pickNextLesson } from '../../utils/homeRoutine';
import type { Course, Lesson, MainTabParamList, RootStackParamList } from '../../types';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const user = useAuthStore((state) => state.user);
  const loadCourses = useCourseStore((state) => state.load);
  const loading = useCourseStore((state) => state.loading);
  const storeCourses = useCourseStore((state) => state.courses);
  const progressMap = useAcademyStore((state) => state.progress);
  const diagnostic = useAcademyStore((state) => state.diagnostic);
  const notifications = useNotificationStore((state) => state.items);
  const [recommended, setRecommended] = useState<Course[]>([]);
  const [heroLessons, setHeroLessons] = useState<Lesson[]>(seedLessons);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (!user?.id) return;
    void getRecommendedCourses(user.id, diagnostic.topSkills).then(setRecommended);
  }, [user?.id, diagnostic.topSkills]);

  const displayCourses = useMemo(() => {
    if (recommended.length) return recommended;
    return storeCourses.length ? storeCourses : seedCourses;
  }, [recommended, storeCourses]);

  const continueCourses = useMemo(() => {
    return displayCourses
      .map((course) => ({ course, pct: progressMap[course.id]?.percentComplete ?? 0 }))
      .filter((x) => x.pct > 0 && x.pct < 100)
      .sort((a, b) => b.pct - a.pct)
      .map((x) => x.course);
  }, [displayCourses, progressMap]);

  const heroCourse = useMemo(
    () => pickHeroCourse(displayCourses, progressMap),
    [displayCourses, progressMap],
  );

  const heroProgress = heroCourse ? progressMap[heroCourse.id] : undefined;
  const heroLesson = useMemo(() => {
    if (!heroCourse) return null;
    return pickNextLesson(heroCourse.id, heroProgress, heroLessons);
  }, [heroCourse, heroProgress, heroLessons]);

  useEffect(() => {
    if (!heroCourse?.id) return;
    void getLessons(heroCourse.id).then((remote) => {
      if (remote.length) setHeroLessons(remote);
    });
  }, [heroCourse?.id]);

  const stats = useMemo(() => computeProfileStats(progressMap, user), [progressMap, user]);
  const firstName = user?.displayName?.split(' ')[0] || 'alumno';
  const hasUnread = notifications.some((n) => !n.read);

  const heroSkill = heroCourse ? skills.find((s) => s.id === heroCourse.skillId) : undefined;
  const heroTitle = heroLesson?.title ?? heroCourse?.title ?? 'Tu próximo entrenamiento';
  const heroDurationMin = heroLesson
    ? Math.max(1, Math.round(heroLesson.durationSec / 60))
    : heroCourse
      ? Math.max(1, Math.round(heroCourse.durationMin / Math.max(heroCourse.totalLessons, 1)))
      : 10;
  const heroMeta = heroSkill
    ? formatHeroMeta(heroSkill.name, heroDurationMin)
    : 'Explorá el catálogo · Hacer hoy';

  const featuredSkills = useMemo(() => [...skills].sort((a, b) => a.order - b.order).slice(0, 4), []);

  const openHero = () => {
    if (!heroCourse) {
      navigateToExploreTab(navigation);
      return;
    }
    if (heroLesson) {
      navigation.navigate('VideoPlayer', { courseId: heroCourse.id, lessonId: heroLesson.id });
      return;
    }
    navigation.navigate('CourseDetail', { courseId: heroCourse.id });
  };

  return (
    <ScreenWrapper scroll edges={TAB_SCREEN_EDGES} contentStyle={styles.screen}>
      <HomeOrbs />

      <HomeHeader
        firstName={firstName}
        displayName={user?.displayName || 'Alumno T2T'}
        avatarUrl={user?.avatar}
        hasUnreadNotifications={hasUnread}
        onNotificationsPress={() =>
          navigation.navigate('ProfileTab', { screen: 'NotificationsList' })
        }
        onAvatarPress={() => navigation.navigate('ProfileTab', { screen: 'ProfileMain' })}
      />

      <HomeStreakCard streakDays={stats.streakDays} />

      {heroCourse ? (
        <HomeTodayHero
          title={heroTitle}
          meta={heroMeta}
          thumbnail={heroCourse.thumbnail}
          onPress={openHero}
        />
      ) : null}

      <View style={[styles.section, !heroCourse && styles.sectionSpaced]}>
        <SectionHeader
          isFirst
          title="Continuá viendo"
          actionLabel="Ver todo"
          onAction={() => navigateToExploreTab(navigation)}
        />

        {loading && !continueCourses.length ? <CourseListSkeleton /> : null}

        {continueCourses.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {continueCourses.map((course) => (
              <ContinueCourseCard
                key={course.id}
                course={course}
                progressPercent={progressMap[course.id]?.percentComplete ?? 0}
                onPress={() => navigation.navigate('CourseDetail', { courseId: course.id })}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>

      <View style={[styles.section, styles.sectionSpaced]}>
        <SectionHeader isFirst title="Habilidades" />

        <View style={styles.skillsRow}>
        {featuredSkills.map((skill) => (
          <HomeSkillChip
            key={skill.id}
            skill={skill}
            onPress={() =>
              navigation.navigate('SkillCatalog', { skillId: skill.id, skillName: skill.name })
            }
          />
        ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'relative',
  },
  section: {
    gap: 18,
  },
  sectionSpaced: {
    marginTop: 18,
  },
  carousel: {
    gap: 12,
  },
  skillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
});
