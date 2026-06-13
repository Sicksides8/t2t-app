import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { navigateToExploreTab } from '../../navigation/tabNavigation';
import { PaywallModal, SectionHeader } from '../../components/academy';
import {
  ContinueCourseCard,
  HomeHeader,
  HomeSkillChip,
  HomeStreakCard,
  HomeTodayHero,
} from '../../components/home';
import { EmptyState, ScreenWrapper, TAB_SCREEN_EDGES } from '../../components/ui';
import { CourseListSkeleton } from '../../components/ui/Skeleton';
import { skills } from '../../data/academy';
import { getLessons, getRecommendedCourses } from '../../services/academyService';
import { useAcademyStore, useAuthStore, useCourseStore, useNotificationStore } from '../../stores';
import { Spacing } from '../../theme';
import { computeProfileStats } from '../../utils/profileStats';
import { dayKey } from '../../services/streakService';
import { formatHeroMeta, pickHeroCourse, pickNextLesson } from '../../utils/homeRoutine';
import { sameSkillId } from '../../utils/skillId';
import {
  canAccessCourse,
  canAccessLesson,
  getRequiredPlan,
} from '../../utils/subscriptionAccess';
import type {
  Course,
  Lesson,
  MainTabParamList,
  RootStackParamList,
  SubscriptionPlanId,
} from '../../types';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'HomeTab'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export function HomeScreen() {
  const navigation = useNavigation<HomeNav>();
  const user = useAuthStore((state) => state.user);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
  const loadCourses = useCourseStore((state) => state.load);
  const loading = useCourseStore((state) => state.loading);
  const storeCourses = useCourseStore((state) => state.courses);
  const progressMap = useAcademyStore((state) => state.progress);
  const diagnostic = useAcademyStore((state) => state.diagnostic);
  const notifications = useNotificationStore((state) => state.items);
  const [recommended, setRecommended] = useState<Course[]>([]);
  const [heroLessons, setHeroLessons] = useState<Lesson[]>([]);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallPlan, setPaywallPlan] = useState<SubscriptionPlanId>('pro');

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (!user?.id) return;
    void getRecommendedCourses(user.id, diagnostic.topSkills).then(setRecommended);
  }, [user?.id, diagnostic.topSkills]);

  const displayCourses = useMemo(() => {
    if (recommended.length) return recommended;
    return storeCourses;
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

  const heroSkill = heroCourse ? skills.find((s) => sameSkillId(s.id, heroCourse.skillId)) : undefined;
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

  const openPaywallForCourse = (course: Course) => {
    const required = getRequiredPlan(course);
    setPaywallPlan(required === 'free' ? 'pro' : required);
    setPaywallVisible(true);
  };

  const openHero = () => {
    if (!heroCourse) {
      navigateToExploreTab(navigation);
      return;
    }
    if (heroLesson && !canAccessLesson(heroLesson, heroCourse, user)) {
      openPaywallForCourse(heroCourse);
      return;
    }
    if (!heroLesson && !canAccessCourse(heroCourse, user)) {
      openPaywallForCourse(heroCourse);
      return;
    }
    if (heroLesson) {
      navigation.navigate('VideoPlayer', { courseId: heroCourse.id, lessonId: heroLesson.id });
      return;
    }
    navigation.navigate('CourseDetail', { courseId: heroCourse.id });
  };

  const openCourseFromCarousel = (course: Course) => {
    if (!canAccessCourse(course, user)) {
      openPaywallForCourse(course);
      return;
    }
    navigation.navigate('CourseDetail', { courseId: course.id });
  };

  return (
    <ScreenWrapper scroll edges={TAB_SCREEN_EDGES} contentStyle={styles.screen}>
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

      <HomeStreakCard
        streakDays={stats.streakDays}
        activeToday={user?.lastActiveDay === dayKey()}
        freezes={stats.freezes}
      />

      {heroCourse ? (
        <HomeTodayHero
          title={heroTitle}
          meta={heroMeta}
          thumbnail={heroCourse.thumbnail}
          onPress={openHero}
        />
      ) : null}

      {!loading && displayCourses.length === 0 ? (
        <View style={styles.sectionSpaced}>
          <EmptyState
            title="Aún no hay cursos disponibles"
            message="Estamos preparando el primer catálogo. En breve vas a poder empezar a entrenar."
            icon="library-outline"
            actionLabel="Explorar habilidades"
            onAction={() => navigateToExploreTab(navigation)}
          />
        </View>
      ) : (
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
                  locked={!canAccessCourse(course, user)}
                  onPress={() => openCourseFromCarousel(course)}
                />
              ))}
            </ScrollView>
          ) : null}
        </View>
      )}

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

      <PaywallModal
        visible={paywallVisible}
        planId={paywallPlan}
        userId={user?.id}
        onClose={() => setPaywallVisible(false)}
        onSuccess={() => {
          void refreshUserProfile();
        }}
      />
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
