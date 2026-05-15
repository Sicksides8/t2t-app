import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Share, StyleSheet, Text } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from 'firebase/auth';
import { DiagnosticResultCarousel } from '../../components/diagnostic';
import { DIAGNOSTIC_SKILLS, computeDiagnosticScores } from '../../data/diagnostic';
import {
  ProfileCertificateRow,
  ProfileChallengeHero,
  ProfileCoinTxRow,
  ProfileCoinsHero,
  ProfileEditAvatar,
  ProfileField,
  ProfileGiftHero,
  ProfileHero,
  ProfileLinkRow,
  ProfileMenuCard,
  ProfileNotificationRow,
  ProfileOrbs,
  ProfilePlanCard,
  ProfileProgressStreakHero,
  ProfileScreenShell,
  ProfileSettingRow,
  ProfileStatTiles,
  ProfileStatsRow,
  ProfileUpsellRow,
} from '../../components/profile';
import { Button, CardGlass, ScreenWrapper, TAB_SCREEN_EDGES } from '../../components/ui';
import { EmptyState } from '../../components/ui/EmptyState';
import { CourseListSkeleton } from '../../components/ui/Skeleton';
import { courses, plans, skills } from '../../data/academy';
import * as authService from '../../services/authService';
import { redeemCode } from '../../services/academyService';
import { auth } from '../../services/firebase';
import { getGamificationRepo } from '../../services/gamificationService';
import { redeemSubscriptionCode } from '../../services/subscriptionService';
import { uploadUserAvatar } from '../../services/storageService';
import { useAcademyStore, useAuthStore, useNotificationStore } from '../../stores';
import { Colors, Spacing, Typography } from '../../theme';
import { computeProfileStats } from '../../utils/profileStats';
import type { Achievement, CoinTransaction, MainTabParamList, ProfileStackParamList } from '../../types';

type ProfileProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, keyof ProfileStackParamList>,
  BottomTabScreenProps<MainTabParamList, 'ProfileTab'>
>;

const PRIMARY_MENU = [
  {
    label: 'Mi diagnóstico',
    screen: 'DiagnosticApp' as const,
    icon: 'analytics-outline' as const,
    iconColor: Colors.accentSecondary,
  },
  {
    label: 'Mi suscripción',
    screen: 'Subscription' as const,
    icon: 'diamond-outline' as const,
  },
  {
    label: 'Canjear código',
    screen: 'RedeemCode' as const,
    icon: 'gift-outline' as const,
    highlight: true,
  },
];

const MORE_MENU = [
  { label: 'Editar perfil', screen: 'EditProfile' as const, icon: 'person-outline' as const },
  { label: 'Historial de pagos', screen: 'PaymentDetail' as const, icon: 'receipt-outline' as const },
  { label: 'Certificados y logros', screen: 'Certificates' as const, icon: 'ribbon-outline' as const },
  { label: 'Mi progreso', screen: 'Progress' as const, icon: 'trending-up-outline' as const },
  { label: 'Historial de coins', screen: 'CoinsHistory' as const, icon: 'logo-bitcoin' as const },
  { label: 'Desafío semanal', screen: 'WeeklyChallenge' as const, icon: 'flame-outline' as const },
  { label: 'Notificaciones', screen: 'NotificationsList' as const, icon: 'notifications-outline' as const },
  { label: 'Ajustes', screen: 'SystemStates' as const, icon: 'settings-outline' as const },
];

function formatCertDate(date: Date): string {
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ProfileMainScreen({ navigation }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
  const progressMap = useAcademyStore((state) => state.progress);
  const planName = plans.find((p) => p.id === user?.selectedPlan)?.name || 'Starter';

  const stats = useMemo(() => computeProfileStats(progressMap, user), [progressMap, user]);

  useEffect(() => {
    if (!user?.id) return;
    void refreshUserProfile();
    void getGamificationRepo()
      .getUserCoins(user.id)
      .then(() => refreshUserProfile())
      .catch(() => undefined);
  }, [user?.id, refreshUserProfile]);

  return (
    <ScreenWrapper scroll edges={TAB_SCREEN_EDGES} contentStyle={styles.screen}>
      <ProfileOrbs />
      <ProfileHero
        displayName={user?.displayName || 'Alumno T2T'}
        email={user?.email || ''}
        avatarUrl={user?.avatar}
        planName={planName}
      />
      <ProfileStatsRow streakDays={stats.streakDays} coins={stats.coins} modules={stats.modules} />

      {PRIMARY_MENU.map((item) => (
        <ProfileMenuCard
          key={item.screen}
          label={item.label}
          icon={item.icon}
          iconColor={item.iconColor}
          highlight={item.highlight}
          onPress={() => navigation.navigate(item.screen)}
        />
      ))}

      <Text style={styles.sectionLabel}>Más opciones</Text>
      {MORE_MENU.map((item) => (
        <ProfileMenuCard
          key={item.screen}
          label={item.label}
          icon={item.icon}
          onPress={() => navigation.navigate(item.screen)}
        />
      ))}

      <Button title="Cerrar sesión" variant="ghost" onPress={logout} style={styles.logout} />
    </ScreenWrapper>
  );
}

export function RedeemCodeScreen({ navigation }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      Alert.alert('Código vacío', 'Ingresá un código de promoción.');
      return;
    }
    if (!user?.id) return;
    setBusy(true);
    try {
      const subscriptionId = await redeemSubscriptionCode(trimmed);
      if (subscriptionId) {
        await authService.updateUserFields(user.id, { subscriptionId });
      } else {
        await redeemCode(user.id, trimmed);
      }
      await refreshUserProfile();
      Alert.alert('¡Listo!', 'Tu código fue canjeado correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('No se pudo canjear', 'Revisá el código e intentá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProfileScreenShell title="Canjear código" onBack={() => navigation.goBack()}>
      <ProfileGiftHero />
      <Text style={styles.intro}>
        Ingresá el código que recibiste por email o promoción para activar tu plan o beneficios.
      </Text>
      <ProfileField
        label="Código promocional"
        value={code}
        onChangeText={setCode}
        placeholder="Ej. T2T-PRO-2026"
      />
      <Button title="Canjear" loading={busy} onPress={() => void submit()} />
    </ProfileScreenShell>
  );
}

export function EditProfileScreen({ navigation }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDisplayName(user?.displayName || '');
  }, [user?.displayName]);

  const saveProfile = async () => {
    if (!user?.id) return;
    const next = displayName.trim() || user.displayName;
    setBusy(true);
    try {
      await authService.updateUserFields(user.id, { displayName: next });
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: next });
      await refreshUserProfile();
    } finally {
      setBusy(false);
    }
  };

  const pickAndUploadAvatar = async () => {
    if (!user?.id) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (picked.canceled || !picked.assets[0]?.uri) return;
    setBusy(true);
    try {
      const url = await uploadUserAvatar(picked.assets[0].uri, user.id);
      await authService.updateUserFields(user.id, { avatar: url });
      if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url });
      await refreshUserProfile();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProfileScreenShell title="Editar perfil" onBack={() => navigation.goBack()}>
      <ProfileEditAvatar
        displayName={displayName || user?.displayName || 'Alumno T2T'}
        avatarUrl={user?.avatar}
        onPress={() => void pickAndUploadAvatar()}
      />
      <ProfileField
        label="Nombre"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={user?.displayName || 'Tu nombre'}
      />
      <ProfileField label="Email" value={user?.email || ''} editable={false} />
      <ProfileField
        label="Bio"
        value={bio}
        onChangeText={setBio}
        placeholder="Contanos sobre vos..."
        multiline
      />
      <Button title="Guardar cambios" loading={busy} onPress={() => void saveProfile()} />
    </ProfileScreenShell>
  );
}

export function SubscriptionScreen({ navigation }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const plan = plans.find((p) => p.id === user?.selectedPlan) || plans[0];

  return (
    <ProfileScreenShell title="Mi suscripción" onBack={() => navigation.goBack()}>
      <ProfilePlanCard plan={plan} />
      <ProfileUpsellRow />
    </ProfileScreenShell>
  );
}

export function PaymentDetailScreen({ navigation }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const plan = plans.find((p) => p.id === user?.selectedPlan) || plans[0];
  const rows = [
    {
      id: 'sub-current',
      label: plan.name,
      amount: plan.price > 0 ? `$${plan.price}/mes` : 'Gratis',
      date: user?.updatedAt ? formatCertDate(user.updatedAt) : '—',
    },
  ];

  return (
    <ProfileScreenShell title="Historial de pagos" onBack={() => navigation.goBack()}>
      {plan.price <= 0 && !user?.subscriptionId ? (
        <EmptyState
          title="Sin pagos registrados"
          message="Tu plan actual es gratuito. Cuando actives una suscripción paga, verás el detalle aquí."
          icon="receipt-outline"
        />
      ) : (
        rows.map((row) => (
          <CardGlass key={row.id} style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{row.label}</Text>
            <Text style={styles.paymentAmount}>{row.amount}</Text>
            <Text style={styles.paymentDate}>{row.date}</Text>
          </CardGlass>
        ))
      )}
    </ProfileScreenShell>
  );
}

export function DiagnosticAppScreen({ navigation }: ProfileProps) {
  const diagnostic = useAcademyStore((state) => state.diagnostic);
  const { scores } = useMemo(() => computeDiagnosticScores(diagnostic.answers), [diagnostic.answers]);

  const shareResult = async () => {
    const lines = DIAGNOSTIC_SKILLS.map((id) => {
      const name = skills.find((s) => s.id === id)?.name ?? id;
      return `• ${name}: ${scores[id] ?? 0}%`;
    });
    await Share.share({
      message: `Mi diagnóstico T2T Academy\n\n${lines.join('\n')}`,
    });
  };

  const viewTrainingPlan = () => {
    navigation.getParent()?.navigate('HomeTab');
  };

  return (
    <ProfileScreenShell
      title="Mi diagnóstico"
      onBack={() => navigation.goBack()}
      rightLabel="Compartir"
      onRightPress={() => void shareResult()}
    >
      <DiagnosticResultCarousel diagnostic={diagnostic} title="Tu mapa T2T" />
      <Button
        title="Ver mi plan de entrenamiento"
        onPress={viewTrainingPlan}
        style={styles.diagnosticCta}
      />
    </ProfileScreenShell>
  );
}

export function CertificatesScreen({ navigation }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    void getGamificationRepo()
      .getUserAchievements(user.id)
      .then((list) => {
        if (list.length) setItems(list);
        else {
          setItems(
            courses.slice(0, 2).map((course, i) => ({
              id: course.id,
              userId: user.id,
              type: 'course_completed',
              title: course.title,
              description: 'Certificado demo',
              earnedAt: new Date(Date.now() - i * 86400000),
            })),
          );
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <ProfileScreenShell title="Certificados y logros" onBack={() => navigation.goBack()}>
      {loading ? <CourseListSkeleton /> : null}
      {items.map((item) => (
        <ProfileCertificateRow
          key={item.id}
          title={item.title}
          subtitle={item.description || formatCertDate(item.earnedAt)}
          onPress={() => navigation.navigate('CertificateDetail', { certificateId: item.id })}
        />
      ))}
    </ProfileScreenShell>
  );
}

export function CertificateDetailScreen({ navigation, route }: NativeStackScreenProps<ProfileStackParamList, 'CertificateDetail'>) {
  const course = courses.find((item) => item.id === route.params.certificateId);
  return (
    <ProfileScreenShell title={course?.title || 'Certificado T2T'} onBack={() => navigation.goBack()}>
      <CardGlass>
        <Text style={styles.muted}>Compartir PDF cuando el backend emita el certificado oficial.</Text>
      </CardGlass>
    </ProfileScreenShell>
  );
}

export function ProgressScreen({ navigation }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const progressMap = useAcademyStore((state) => state.progress);
  const profileStats = useMemo(() => computeProfileStats(progressMap, user), [progressMap, user]);
  const lessonStats = useMemo(() => {
    const entries = Object.values(progressMap);
    const lessons = entries.reduce((sum, p) => sum + p.lessonsCompleted.length, 0);
    const completedCourses = entries.filter((p) => p.percentComplete >= 100).length;
    const inProgress = entries.filter((p) => p.percentComplete > 0 && p.percentComplete < 100).length;
    return { lessons, completedCourses, inProgress };
  }, [progressMap]);

  return (
    <ProfileScreenShell title="Mi progreso" onBack={() => navigation.goBack()}>
      <ProfileProgressStreakHero streakDays={profileStats.streakDays} />
      <ProfileStatTiles
        tiles={[
          { value: lessonStats.lessons, label: 'Lecciones' },
          { value: lessonStats.inProgress, label: 'En curso' },
          { value: lessonStats.completedCourses, label: 'Completados' },
        ]}
      />
      <ProfileLinkRow
        icon="logo-bitcoin"
        title="Historial de coins"
        subtitle={`${profileStats.coins} coins acumuladas`}
        onPress={() => navigation.navigate('CoinsHistory')}
      />
    </ProfileScreenShell>
  );
}

export function CoinsHistoryScreen({ navigation }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const [txs, setTxs] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    void getGamificationRepo()
      .getCoinTransactions(user.id)
      .then((list) => {
        if (list.length) setTxs(list);
        else {
          setTxs([
            { id: '1', userId: user.id, amount: 10, type: 'earned', reason: 'Lección completada', createdAt: new Date() },
            { id: '2', userId: user.id, amount: 10, type: 'earned', reason: 'Lección completada', createdAt: new Date() },
            { id: '3', userId: user.id, amount: 15, type: 'earned', reason: 'Desafío semanal', createdAt: new Date() },
          ]);
        }
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <ProfileScreenShell title="Historial de coins" onBack={() => navigation.goBack()}>
      <ProfileCoinsHero balance={user?.coins ?? 0} />
      {loading ? <CourseListSkeleton /> : null}
      {txs.map((tx) => (
        <ProfileCoinTxRow
          key={tx.id}
          amount={tx.amount}
          reason={tx.reason}
          earned={tx.type === 'earned'}
        />
      ))}
    </ProfileScreenShell>
  );
}

export function WeeklyChallengeScreen({ navigation }: ProfileProps) {
  const progressMap = useAcademyStore((state) => state.progress);
  const [challenge, setChallenge] = useState<Awaited<ReturnType<ReturnType<typeof getGamificationRepo>['getWeeklyChallenge']>>>(null);

  useEffect(() => {
    void getGamificationRepo().getWeeklyChallenge().then(setChallenge);
  }, []);

  const lessonsThisWeek = useMemo(
    () => Object.values(progressMap).reduce((sum, p) => sum + p.lessonsCompleted.length, 0) % 10,
    [progressMap],
  );
  const target = challenge?.targetLessons ?? 3;
  const progress = Math.min(lessonsThisWeek, target);

  return (
    <ProfileScreenShell title="Desafío semanal" onBack={() => navigation.goBack()}>
      <ProfileChallengeHero
        label="DESAFÍO SEMANAL"
        title={challenge?.title || 'Desafío activo'}
        progress={progress}
        target={target}
        reward={challenge?.xpReward ?? 50}
      />
    </ProfileScreenShell>
  );
}

export function AppNotificationsScreen({ navigation }: ProfileProps) {
  const items = useNotificationStore((state) => state.items);
  const hasUnread = items.some((item) => !item.read);

  const markAllRead = () => {
    useNotificationStore.setState((state) => ({
      items: state.items.map((item) => ({ ...item, read: true })),
    }));
  };

  return (
    <ProfileScreenShell
      title="Notificaciones"
      onBack={() => navigation.goBack()}
      rightLabel={hasUnread ? 'Marcar leídas' : undefined}
      onRightPress={hasUnread ? markAllRead : undefined}
    >
      {items.length === 0 ? (
        <EmptyState
          title="Sin avisos"
          message="Te avisaremos por push cuando haya novedades en tu academia."
          icon="notifications-outline"
        />
      ) : (
        items.map((item) => (
          <ProfileNotificationRow
            key={item.id}
            title={item.title}
            body={`${item.body} · ${formatCertDate(item.createdAt)}`}
            unread={!item.read}
          />
        ))
      )}
    </ProfileScreenShell>
  );
}

export function SystemStatesScreen({ navigation }: ProfileProps) {
  const version = Constants.expoConfig?.version || '1.0.0';
  return (
    <ProfileScreenShell title="Ajustes" onBack={() => navigation.goBack()}>
      <ProfileSettingRow icon="phone-portrait-outline" label="Versión de la app" value={version} />
      <ProfileSettingRow
        icon="cloud-offline-outline"
        label="Sin conexión"
        onPress={() => navigation.navigate('Offline')}
      />
      <ProfileSettingRow
        icon="refresh-outline"
        label="Error de carga"
        onPress={() => navigation.navigate('ErrorState')}
      />
      <ProfileSettingRow
        icon="document-outline"
        label="Estado vacío"
        onPress={() => navigation.navigate('EmptyBoard')}
      />
      <ProfileSettingRow
        icon="construct-outline"
        label="Mantenimiento"
        onPress={() => navigation.navigate('Maintenance')}
      />
    </ProfileScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    position: 'relative',
  },
  sectionLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  logout: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  intro: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  muted: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  paymentRow: {
    marginBottom: Spacing.md,
    gap: 4,
  },
  paymentLabel: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  paymentAmount: {
    ...Typography.h2,
    color: Colors.accentHighlight,
  },
  paymentDate: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  diagnosticCta: {
    marginTop: -20,
  },
});
