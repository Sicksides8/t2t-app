import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ActivityIndicator, Modal, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { CompositeScreenProps } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { updateProfile } from 'firebase/auth';
import { DiagnosticRadarChart } from '../../components/diagnostic';
import { DIAGNOSTIC_SKILLS, computeDiagnosticScores, SKILL_LABELS, SKILL_LABELS_SHORT } from '../../data/diagnostic';
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
  ProfilePlanCard,
  ProfileScreenShell,
  ProfileSettingRow,
  ProfileStatTiles,
  ProfileStatsRow,
  ProfileUpsellRow,
} from '../../components/profile';
import { Button, CardGlass, ScreenWrapper, T2TCoin, TAB_SCREEN_EDGES, AppAlert } from '../../components/ui';
import type { AppAlertTone } from '../../components/ui';
import { EmptyState } from '../../components/ui/EmptyState';
import { CourseListSkeleton } from '../../components/ui/Skeleton';
import { profileGoBack } from '../../navigation/profileNavigation';
import { plans, skills } from '../../data/academy';
import * as authService from '../../services/authService';
import { fetchCourseById } from '../../services/courseService';
import { auth } from '../../services/firebase';
import { getGamificationRepo, loadWeeklyChallengeReflection, REFLECTION_MIN_CHARS, submitWeeklyChallengeReflection } from '../../services/gamificationService';
import { getPaymentById, getPaymentHistory } from '../../services/paymentService';
import {
  getBillingProvider,
  getCanonicalPlan,
  getCanonicalPlans,
} from '../../services/subscriptionService';
import { applyCodeToUser } from '../../services/couponService';
import { uploadUserAvatar } from '../../services/storageService';
import { useAcademyStore, useAuthStore, useNotificationStore } from '../../stores';
import { Colors, Spacing, Typography } from '../../theme';
import { computeProfileStats } from '../../utils/profileStats';
import { hasActivePaidPlan, subscriptionPlanToSeedPlan } from '../../utils/subscriptionAccess';
import { getPlanDisplayName } from '../../utils/planDisplay';
import { exportCertificatePdf } from '../../utils/exportCertificate';
import { estimatePlanChange } from '../../utils/subscriptionProration';
import type {
  Achievement,
  BillingCycle,
  CoinTransaction,
  MainTabParamList,
  ProfileStackParamList,
  Subscription,
  SubscriptionPlanId,
} from '../../types';

type ProfileProps = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, keyof ProfileStackParamList>,
  BottomTabScreenProps<MainTabParamList, 'ProfileTab'>
>;

type ProfileMenuItem = {
  label: string;
  screen: keyof ProfileStackParamList;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  highlight?: boolean;
  iconNode?: React.ReactNode;
};

const PROFILE_MENU: ProfileMenuItem[] = [
  {
    label: 'Mi diagnóstico',
    screen: 'DiagnosticApp',
    icon: 'locate-outline',
    iconColor: Colors.accentHighlight,
  },
  {
    label: 'Mi progreso',
    screen: 'Progress',
    icon: 'trending-up',
    iconColor: Colors.accentHighlight,
  },
  {
    label: 'Mis T2T Coins',
    screen: 'CoinsHistory',
    icon: 'logo-usd',
    iconColor: Colors.accentCoin,
    iconNode: <T2TCoin size={22} />,
  },
  {
    label: 'Mi suscripción',
    screen: 'Subscription',
    icon: 'diamond-outline',
    iconColor: Colors.accentPrimary,
    iconNode: <MaterialCommunityIcons name="crown" size={22} color={Colors.accentPrimary} />,
  },
  {
    label: 'Canjear código',
    screen: 'RedeemCode',
    icon: 'gift-outline',
    iconColor: '#FFFFFF',
    highlight: true,
  },
];

const SETTINGS_MENU = [
  { label: 'Certificados', screen: 'Certificates' as const, icon: 'ribbon-outline' as const },
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
  // Preferimos el plan canónico (free|pro|elite); fallback al legacy selectedPlan.
  const planName = (() => {
    if (user?.subscriptionPlan) return getPlanDisplayName(user.subscriptionPlan);
    return plans.find((p) => p.id === user?.selectedPlan)?.name || 'Open';
  })();

  const stats = useMemo(() => computeProfileStats(progressMap, user), [progressMap, user]);

  useEffect(() => {
    if (!user?.id) return;
    void (async () => {
      try {
        const coins = await getGamificationRepo().getUserCoins(user.id);
        const current = useAuthStore.getState().user;
        if (current && current.id === user.id && current.coins !== coins) {
          useAuthStore.getState().setUser({ ...current, coins });
        }
        await refreshUserProfile();
      } catch {
        /* offline */
      }
    })();
  }, [user?.id, refreshUserProfile]);

  return (
    <ScreenWrapper scroll edges={TAB_SCREEN_EDGES} contentStyle={styles.screen}>
      <ProfileHero
        displayName={user?.displayName || 'Alumno T2T'}
        email={user?.email || ''}
        avatarUrl={user?.avatar}
        planName={planName}
        onPressAvatar={() => navigation.navigate('EditProfile')}
      />
      <ProfileStatsRow streakDays={stats.streakDays} coins={stats.coins} modules={stats.modules} />

      {PROFILE_MENU.map((item) => (
        <ProfileMenuCard
          key={item.screen + item.label}
          label={item.label}
          icon={item.icon}
          iconColor={item.iconColor}
          iconNode={item.iconNode}
          highlight={item.highlight}
          onPress={() => navigation.navigate(item.screen as never)}
        />
      ))}

      <Text style={styles.sectionLabel}>Configuración</Text>
      {SETTINGS_MENU.map((item) => (
        <ProfileMenuCard
          key={item.screen}
          label={item.label}
          icon={item.icon}
          onPress={() => navigation.navigate(item.screen as never)}
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

  const alreadyPaid = hasActivePaidPlan(user);
  const currentPlanLabel = user?.subscriptionPlan
    ? getPlanDisplayName(user.subscriptionPlan)
    : null;

  const submit = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      Alert.alert('Código vacío', 'Ingresá un código de promoción.');
      return;
    }
    if (!user?.id) return;
    setBusy(true);
    try {
      // TODO MERCADOPAGO: cuando exista la pasarela real, la validación
      // del código la hace el backend antes de generar la preference.
      const result = await applyCodeToUser(user.id, trimmed);
      if (result.ok) {
        await refreshUserProfile();
        Alert.alert('¡Listo!', result.message, [
          { text: 'Ver mi suscripción', onPress: () => navigation.navigate('Subscription') },
          { text: 'OK', onPress: () => profileGoBack(navigation), style: 'cancel' },
        ]);
      } else {
        Alert.alert('No se pudo canjear', result.message);
      }
    } catch {
      Alert.alert('No se pudo canjear', 'Revisá el código e intentá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  if (alreadyPaid) {
    return (
      <ProfileScreenShell title="Canjear código" navigation={navigation}>
        <ProfileGiftHero />
        <View style={styles.redeemBlockedCard}>
          <Ionicons
            name="shield-checkmark"
            size={28}
            color={Colors.accentHighlight}
            style={styles.redeemBlockedIcon}
          />
          <Text style={styles.redeemBlockedTitle}>
            Ya tenés {currentPlanLabel ?? 'tu plan'} activo
          </Text>
          <Text style={styles.redeemBlockedBody}>
            Los códigos promocionales son sólo para activar tu primer plan. Como ya tenés una
            suscripción paga vigente, no podés canjear códigos en este momento.
          </Text>
        </View>
        <Button
          title="Ver mi suscripción"
          onPress={() => navigation.navigate('Subscription')}
        />
      </ProfileScreenShell>
    );
  }

  return (
    <ProfileScreenShell title="Canjear código" navigation={navigation}>
      <ProfileGiftHero />
      <Text style={styles.intro}>
        Ingresá el código para activar tu plan con descuento. Sólo para usuarios que aún no
        tienen un plan pago.
      </Text>
      <ProfileField
        label="Código promocional"
        value={code}
        onChangeText={(t) => setCode(t.toUpperCase())}
        placeholder="Ej. T2T-LAUNCH-30D"
        autoCapitalize="characters"
      />
      <Button title="Canjear" loading={busy} onPress={() => void submit()} />
    </ProfileScreenShell>
  );
}

export function EditProfileScreen({ navigation }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState<{
    tone: AppAlertTone;
    title: string;
    message: string;
  } | null>(null);

  const emailValue = user?.email || auth.currentUser?.email || 'Sin email';

  useEffect(() => {
    setDisplayName(user?.displayName || '');
    setBio(user?.bio || '');
  }, [user?.displayName, user?.bio]);

  const saveProfile = async () => {
    if (!user?.id) return;
    const next = displayName.trim() || user.displayName;
    const nextBio = bio.trim();
    setBusy(true);
    try {
      await authService.updateUserFields(user.id, { displayName: next, bio: nextBio });
      if (auth.currentUser) await updateProfile(auth.currentUser, { displayName: next });
      await refreshUserProfile();
      setAlert({
        tone: 'success',
        title: 'Perfil actualizado',
        message: 'Tus cambios se guardaron correctamente.',
      });
    } catch (error: unknown) {
      if (__DEV__) {
        console.warn('[EditProfile] save failed', error);
      }
      setAlert({
        tone: 'error',
        title: 'No se pudo guardar',
        message: 'Revisá la conexión e intentá de nuevo.',
      });
    } finally {
      setBusy(false);
    }
  };

  const pickAndUploadAvatar = async () => {
    if (!user?.id || busy) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setAlert({
        tone: 'error',
        title: 'Permiso necesario',
        message: 'Necesitamos acceso a tus fotos para cambiar el avatar.',
      });
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (picked.canceled || !picked.assets[0]?.uri) return;
    const asset = picked.assets[0];
    setBusy(true);
    try {
      const url = await uploadUserAvatar(asset.uri, user.id, {
        size: asset.fileSize,
        contentType: asset.mimeType,
        filename: asset.fileName || undefined,
      });
      await authService.updateUserFields(user.id, { avatar: url });
      if (auth.currentUser) await updateProfile(auth.currentUser, { photoURL: url });
      await refreshUserProfile();
      setAlert({
        tone: 'success',
        title: 'Foto actualizada',
        message: 'Tu foto de perfil se subió correctamente.',
      });
    } catch (error: unknown) {
      if (__DEV__) {
        console.warn('[EditProfile] avatar upload failed', error);
      }
      setAlert({
        tone: 'error',
        title: 'No se pudo subir la foto',
        message:
          error instanceof Error
            ? error.message
            : 'Revisá la conexión e intentá con otra imagen.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProfileScreenShell
      title="Editar perfil"
      navigation={navigation}
      footer={<Button title="Guardar cambios" loading={busy} onPress={() => void saveProfile()} />}
    >
      <ProfileEditAvatar
        displayName={displayName || user?.displayName || 'Alumno T2T'}
        avatarUrl={user?.avatar}
        onPress={() => void pickAndUploadAvatar()}
      />
      <ProfileField
        label="Nombre completo"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder={user?.displayName || 'Tu nombre'}
      />
      <ProfileField label="Email · no editable" value={emailValue} editable={false} />
      <ProfileField
        label="Bio"
        value={bio}
        onChangeText={setBio}
        placeholder="Contanos sobre vos..."
        multiline
      />
      <AppAlert
        visible={alert !== null}
        tone={alert?.tone ?? 'info'}
        title={alert?.title ?? ''}
        message={alert?.message ?? ''}
        onConfirm={() => setAlert(null)}
      />
    </ProfileScreenShell>
  );
}

export function SubscriptionScreen({ navigation }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
  // Construimos el Plan que muestra la card desde el catálogo canónico
  // (free/pro/elite) para que el nombre y el precio sean los reales.
  // El seed legacy se usa sólo como fallback para features/durationDays.
  const seedPlanId = subscriptionPlanToSeedPlan(user?.subscriptionPlan);
  const seedPlan = plans.find((p) => p.id === seedPlanId) || plans[0];
  const canonical = getCanonicalPlan(user?.subscriptionPlan ?? 'free');
  const plan = {
    ...seedPlan,
    name: canonical.name,
    price: canonical.priceMonthly,
    currency: canonical.currency,
  };
  const [payments, setPayments] = useState<import('../../types').Payment[]>([]);
  const [busy, setBusy] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    void getPaymentHistory(user.id).then(setPayments);
  }, [user?.id]);

  const status = user?.subscriptionStatus ?? 'free';
  const hasActiveSubscription =
    status === 'trialing' || status === 'active' || status === 'cancelled';
  const canCancel = status === 'trialing' || status === 'active';

  const handleOpenStoreSubscriptions = async () => {
    if (!user?.id || busy) return;
    setBusy(true);
    try {
      await getBillingProvider().cancel(user.id);
      const storeLabel = Platform.OS === 'ios' ? 'Suscripciones de Apple' : 'Google Play';
      Alert.alert(
        storeLabel,
        Platform.OS === 'ios'
          ? 'Te llevamos a Ajustes para gestionar tu suscripción.'
          : 'Te llevamos a Google Play para gestionar o cancelar tu suscripción. Mantenés el acceso hasta el fin del período pagado.',
      );
    } catch (err) {
      console.error('[SubscriptionScreen] open store subscriptions failed:', err);
      Alert.alert('Error', 'No se pudo abrir la gestión de suscripciones. Intentá de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const handleSelectPlan = async (newPlanId: SubscriptionPlanId, cycle: BillingCycle) => {
    if (!user?.id) return;
    const previousPlan = user.subscriptionPlan;
    setChangeOpen(false);
    setBusy(true);
    try {
      await getBillingProvider().changePlan(user.id, newPlanId, { cycle });
      await refreshUserProfile();
      const updatedPlan = useAuthStore.getState().user?.subscriptionPlan;
      const list = await getPaymentHistory(user.id);
      setPayments(list);
      if (updatedPlan === newPlanId && updatedPlan !== previousPlan) {
        Alert.alert('Plan actualizado', `Tu nuevo plan es ${getPlanDisplayName(newPlanId)}.`);
      }
    } catch (err) {
      console.error('[SubscriptionScreen] changePlan failed:', err);
      const message =
        err instanceof Error ? err.message : 'No se pudo cambiar el plan. Intentá de nuevo.';
      Alert.alert('Error', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProfileScreenShell title="Mi suscripción" navigation={navigation}>
      <ProfilePlanCard plan={plan} status={status} renewsAt={user?.subscriptionRenewsAt} />

      {hasActiveSubscription ? (
        <View style={styles.subActionsCol}>
          <View style={styles.subActionsRow}>
            <Button
              title="Cambiar de plan"
              variant="ghost"
              onPress={() => setChangeOpen(true)}
              disabled={busy}
              style={styles.subActionBtn}
            />
          </View>
          {canCancel ? (
            <ProfileLinkRow
              icon="open-outline"
              title={
                Platform.OS === 'ios'
                  ? 'Gestionar en Suscripciones de Apple'
                  : 'Gestionar o cancelar en Google Play'
              }
              subtitle="La cancelación se hace desde tu cuenta de la tienda. Mantenés el acceso hasta el fin del período pagado."
              onPress={handleOpenStoreSubscriptions}
            />
          ) : null}
        </View>
      ) : (
        <Button
          title="Activar plan Pro"
          onPress={() => setChangeOpen(true)}
          disabled={busy}
        />
      )}

      <ProfileUpsellRow />
      <Text style={styles.sectionH2}>Historial de pagos</Text>
      {payments.length === 0 ? (
        <Text style={styles.muted}>Todavía no hay pagos registrados.</Text>
      ) : null}
      {payments.map((payment) => (
        <Pressable
          key={payment.id}
          onPress={() => navigation.navigate('PaymentDetail', { paymentId: payment.id })}
          style={styles.paymentRowV2}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.paymentLabel}>{payment.planLabel}</Text>
            <Text style={styles.paymentDate}>
              {formatPaymentDate(payment.paidAt)} · {payment.method}
            </Text>
          </View>
          <Text style={styles.paymentAmountInline}>
            {payment.currency} {payment.amount.toFixed(2)}
          </Text>
        </Pressable>
      ))}

      <ChangePlanModal
        visible={changeOpen}
        userId={user?.id}
        currentPlan={user?.subscriptionPlan}
        onClose={() => setChangeOpen(false)}
        onSelect={(planId, cycle) => void handleSelectPlan(planId, cycle)}
      />
    </ProfileScreenShell>
  );
}

function ChangePlanModal({
  visible,
  userId,
  currentPlan,
  onClose,
  onSelect,
}: {
  visible: boolean;
  userId?: string;
  currentPlan?: SubscriptionPlanId;
  onClose: () => void;
  onSelect: (planId: SubscriptionPlanId, cycle: BillingCycle) => void;
}) {
  const canonical = getCanonicalPlans().filter((p) => p.id !== 'free');
  const [cycle, setCycle] = useState<BillingCycle>('monthly');
  const [currentSub, setCurrentSub] = useState<Subscription | null>(null);
  const [previewPlanId, setPreviewPlanId] = useState<SubscriptionPlanId | null>(null);

  useEffect(() => {
    if (!visible || !userId) {
      setCurrentSub(null);
      setPreviewPlanId(null);
      return;
    }
    void getBillingProvider()
      .getCurrent(userId)
      .then((sub) => {
        setCurrentSub(sub);
        if (sub?.cycle) setCycle(sub.cycle);
      });
  }, [visible, userId]);

  const previewEstimate =
    previewPlanId && previewPlanId !== currentPlan
      ? estimatePlanChange(currentSub, previewPlanId, cycle)
      : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Cambiar de plan</Text>
          <Text style={styles.muted}>Elegí el plan y el ciclo de facturación.</Text>

          <Text style={styles.prorationHint}>
            {Platform.OS === 'ios'
              ? 'Si subís de plan, Apple aplica el saldo de días restantes. Si bajás, el cambio aplica al próximo ciclo.'
              : 'Si subís de plan, Google Play aplica el saldo de días restantes (prorrateo). Si bajás, el cambio aplica al próximo ciclo.'}
          </Text>

          <View style={styles.changePlanToggle}>
            <Pressable
              style={[styles.changePlanToggleBtn, cycle === 'monthly' && styles.changePlanToggleBtnActive]}
              onPress={() => setCycle('monthly')}
            >
              <Text
                style={[
                  styles.changePlanToggleText,
                  cycle === 'monthly' && styles.changePlanToggleTextActive,
                ]}
              >
                Mensual
              </Text>
            </Pressable>
            <Pressable
              style={[styles.changePlanToggleBtn, cycle === 'yearly' && styles.changePlanToggleBtnActive]}
              onPress={() => setCycle('yearly')}
            >
              <Text
                style={[
                  styles.changePlanToggleText,
                  cycle === 'yearly' && styles.changePlanToggleTextActive,
                ]}
              >
                Anual
              </Text>
            </Pressable>
          </View>

          {previewEstimate ? (
            <Text style={styles.prorationHint}>
              {previewEstimate.isUpgrade
                ? `Cargo estimado hoy: ${previewEstimate.currency} ${previewEstimate.estimatedCharge.toFixed(2)} (${Platform.OS === 'ios' ? 'Apple' : 'Google Play'} muestra el monto exacto al confirmar).`
                : 'El cambio se aplicará sin cargo adicional inmediato.'}
            </Text>
          ) : null}

          <View style={{ height: 8 }} />
          {canonical.map((p) => {
            const isCurrent = currentPlan === p.id;
            const price = cycle === 'monthly' ? p.priceMonthly : p.priceYearly;
            const periodLabel = cycle === 'monthly' ? '/ mes' : '/ año';
            return (
              <Pressable
                key={p.id}
                onPress={() => onSelect(p.id, cycle)}
                onPressIn={() => setPreviewPlanId(p.id)}
                disabled={isCurrent}
                style={[styles.modalPlanRow, isCurrent && styles.modalPlanRowDisabled]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalPlanName}>
                    {p.name} {isCurrent ? '· actual' : ''}
                  </Text>
                  <Text style={styles.modalPlanMeta}>
                    {price === 0 ? 'Gratis' : `${p.currency} ${price.toFixed(2)} ${periodLabel}`}
                  </Text>
                </View>
                <Ionicons
                  name={isCurrent ? 'checkmark-circle' : 'chevron-forward'}
                  size={22}
                  color={isCurrent ? Colors.accentHighlight : Colors.accentPrimary}
                />
              </Pressable>
            );
          })}
          <Button title="Cerrar" variant="ghost" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

export function PaymentDetailScreen({
  navigation,
  route,
}: NativeStackScreenProps<ProfileStackParamList, 'PaymentDetail'>) {
  const [payment, setPayment] = useState<import('../../types').Payment | null>(null);

  useEffect(() => {
    void getPaymentById(route.params.paymentId).then(setPayment);
  }, [route.params.paymentId]);

  if (!payment) {
    return (
      <ProfileScreenShell title="Detalle del pago" navigation={navigation}>
        <Text style={styles.muted}>Cargando…</Text>
      </ProfileScreenShell>
    );
  }

  const handleDownload = () => {
    Alert.alert('Descargar comprobante', 'La generación del PDF estará disponible próximamente.');
  };

  return (
    <ProfileScreenShell
      title="Detalle del pago"
      navigation={navigation}
      footer={<Button title="Descargar comprobante (PDF)" onPress={handleDownload} />}
    >
      <View style={styles.paymentHero}>
        <Text style={styles.paymentHeroLabel}>MONTO</Text>
        <Text style={styles.paymentHeroAmount}>
          {payment.currency} {payment.amount.toFixed(2)}
        </Text>
        <Text style={styles.paymentHeroDate}>Pagado · {formatPaymentDate(payment.paidAt)}</Text>
      </View>

      <View style={styles.paymentInfo}>
        <View style={styles.paymentInfoRow}>
          <Text style={styles.paymentInfoKey}>Concepto</Text>
          <Text style={styles.paymentInfoVal}>{payment.planLabel}</Text>
        </View>
        <View style={styles.paymentInfoDiv} />
        <View style={styles.paymentInfoRow}>
          <Text style={styles.paymentInfoKey}>Método</Text>
          <Text style={styles.paymentInfoVal}>{payment.method}</Text>
        </View>
        <View style={styles.paymentInfoDiv} />
        <View style={styles.paymentInfoRow}>
          <Text style={styles.paymentInfoKey}>Transacción</Text>
          <Text style={[styles.paymentInfoVal, styles.mono]}>{payment.txId}</Text>
        </View>
      </View>
    </ProfileScreenShell>
  );
}

function formatPaymentDate(date: Date): string {
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

type EvoAxis = { key: string; label: string; now: number; before: number };

export function DiagnosticAppScreen({ navigation }: ProfileProps) {
  const diagnostic = useAcademyStore((state) => state.diagnostic);

  const { scores, baseScores } = useMemo(
    () => computeDiagnosticScores(diagnostic.answers),
    [diagnostic.answers],
  );

  const resolvedScores = useMemo(
    () => ({ ...scores, ...(diagnostic.scores || {}) }),
    [scores, diagnostic.scores],
  );

  const daysSince = useMemo(() => {
    if (!diagnostic.completedAt) return 32;
    const ms = Date.now() - diagnostic.completedAt.getTime();
    return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
  }, [diagnostic.completedAt]);

  const evolutionAxes: EvoAxis[] = useMemo(
    () =>
      DIAGNOSTIC_SKILLS.map((skillId) => ({
        key: skillId,
        label: SKILL_LABELS_SHORT[skillId],
        now: resolvedScores[skillId] ?? 0,
        before: baseScores[skillId] ?? resolvedScores[skillId] ?? 0,
      })),
    [resolvedScores, baseScores],
  );

  const radarAxes = useMemo(
    () =>
      evolutionAxes.map((axis) => ({
        key: axis.key,
        label: axis.label,
        value: axis.now,
        level: 'strong' as const,
      })),
    [evolutionAxes],
  );

  const previousScoresMap = useMemo(
    () =>
      evolutionAxes.reduce<Record<string, number>>((acc, axis) => {
        acc[axis.key] = axis.before;
        return acc;
      }, {}),
    [evolutionAxes],
  );

  const avgDelta = useMemo(() => {
    const deltas = evolutionAxes.map((axis) => axis.now - axis.before);
    const sum = deltas.reduce((a, b) => a + b, 0);
    return Math.round(sum / Math.max(1, deltas.length));
  }, [evolutionAxes]);

  const shareResult = async () => {
    const lines = evolutionAxes.map(
      (axis) =>
        `• ${SKILL_LABELS[axis.key as keyof typeof SKILL_LABELS]}: ${axis.now}% (antes ${axis.before}%)`,
    );
    await Share.share({
      message: `Mi evolución T2T Academy · ${avgDelta >= 0 ? '+' : ''}${avgDelta}%\n\n${lines.join('\n')}`,
    });
  };

  const viewTrainingPlan = () => {
    navigation.getParent()?.navigate('HomeTab');
  };

  return (
    <ProfileScreenShell
      title="Tu evolución"
      navigation={navigation}
      footer={
        <>
          <Button title="Actualizar mi plan" onPress={viewTrainingPlan} />
          <Button
            title="Rehacer diagnóstico"
            variant="ghost"
            onPress={() => navigation.navigate('DiagnosticRetake')}
          />
          <Pressable onPress={() => void shareResult()} hitSlop={10} style={styles.evoShareBtn}>
            <Text style={styles.evoShareText}>Compartir resultado</Text>
          </Pressable>
        </>
      }
    >
      <Text style={styles.evoScript}>Estás creciendo</Text>
      <Text style={styles.evoHeadline}>Comparativa · {daysSince} días</Text>

      <View style={styles.radarWrap}>
        <DiagnosticRadarChart
          axes={radarAxes}
          previousScores={previousScoresMap}
          size={300}
          maxRadius={110}
        />
      </View>

      <View style={styles.evoLegend}>
        <View style={styles.evoChip}>
          <View style={[styles.evoDot, { backgroundColor: '#FFFFFF66' }]} />
          <Text style={styles.evoChipText}>Antes</Text>
        </View>
        <View style={[styles.evoChip, styles.evoChipNow]}>
          <View style={[styles.evoDot, { backgroundColor: Colors.accentHighlight }]} />
          <Text style={styles.evoChipText}>
            Hoy · {avgDelta >= 0 ? '+' : ''}
            {avgDelta}% promedio
          </Text>
        </View>
      </View>
    </ProfileScreenShell>
  );
}

export function CertificatesScreen({ navigation }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const userName = user?.displayName || 'Alumno T2T';
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    void getGamificationRepo()
      .getUserAchievements(user.id)
      .then((list) => setItems(list))
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleDownload = async (item: Achievement) => {
    if (busyId) return;
    setBusyId(item.id);
    await exportCertificatePdf({
      userName,
      courseTitle: item.title,
      earnedAt: item.earnedAt,
      certificateId: item.id,
    });
    setBusyId(null);
  };

  return (
    <ProfileScreenShell title="Certificados y logros" navigation={navigation}>
      {loading ? <CourseListSkeleton /> : null}
      {items.length === 0 && !loading ? (
        <EmptyState
          title="Aún no hay certificados"
          message="Cuando completes un curso, tu certificado aparecerá acá listo para descargar."
          icon="ribbon-outline"
        />
      ) : null}
      {items.map((item) => (
        <ProfileCertificateRow
          key={item.id}
          title={item.title}
          subtitle={`Obtenido el ${formatCertDate(item.earnedAt)}`}
          onPress={() =>
            navigation.navigate('CertificateDetail', {
              certificateId: item.id,
              courseId: item.courseId,
            })
          }
          onDownload={() => void handleDownload(item)}
          downloading={busyId === item.id}
        />
      ))}
    </ProfileScreenShell>
  );
}

export function CertificateDetailScreen({
  navigation,
  route,
}: NativeStackScreenProps<ProfileStackParamList, 'CertificateDetail'>) {
  const [course, setCourse] = useState<import('../../types').Course | null>(null);
  const [busy, setBusy] = useState(false);
  const user = useAuthStore((state) => state.user);
  const userName = user?.displayName || 'Alumno T2T';
  // Compatibilidad con achievements antiguos: si no viene courseId explícito,
  // tratamos `certificateId` como el id del curso (legado del flujo anterior).
  const courseLookupId = route.params.courseId ?? route.params.certificateId;

  useEffect(() => {
    if (!courseLookupId) return;
    void fetchCourseById(courseLookupId).then(setCourse);
  }, [courseLookupId]);

  const handleDownload = async () => {
    if (busy) return;
    setBusy(true);
    await exportCertificatePdf({
      userName,
      courseTitle: course?.title || 'Curso T2T',
      certificateId: route.params.certificateId,
    });
    setBusy(false);
  };

  return (
    <ProfileScreenShell title="Certificado" navigation={navigation}>
      <View style={styles.certCard}>
        <View style={styles.certSeal}>
          <Ionicons name="ribbon" size={22} color="#FFFFFF" />
        </View>
        <Text style={styles.certBrand}>T2T ACADEMY</Text>
        <Text style={styles.certScript}>Certificado</Text>
        <Text style={styles.certCaption}>Otorgado a</Text>
        <Text style={styles.certName}>{userName}</Text>
        <Text style={styles.certCaption}>por completar el curso</Text>
        <Text style={styles.certCourse}>{course?.title || 'Curso T2T'}</Text>
        <View style={styles.certSign}>
          <Text style={styles.certSignature}>Gustavo R.</Text>
          <Text style={styles.certSignLabel}>Director T2T Academy</Text>
        </View>
      </View>
      <Button
        title={busy ? 'Generando PDF…' : 'Descargar PDF'}
        onPress={() => void handleDownload()}
        disabled={busy}
      />
    </ProfileScreenShell>
  );
}

export function ProgressScreen({ navigation }: ProfileProps) {
  return (
    <ProfileScreenShell
      title="Mi progreso"
      navigation={navigation}
      contentStyle={styles.comingSoonContent}
    >
      <Text style={styles.comingSoonText}>Próximamente</Text>
    </ProfileScreenShell>
  );
}

type CoinTxWithKind = CoinTransaction & { kind: import('../../components/profile/ProfileCoinTxRow').CoinTxKind; caption?: string };

function classifyTx(tx: CoinTransaction): CoinTxWithKind['kind'] {
  if (tx.type === 'spent') return 'spent';
  const reason = tx.reason.toLowerCase();
  if (reason.includes('racha') || reason.includes('streak') || reason.includes('día')) return 'streak';
  if (reason.includes('módulo') || reason.includes('modulo') || reason.includes('curso')) return 'module';
  return 'chapter';
}

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 7) return `hace ${days} días`;
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export function CoinsHistoryScreen({ navigation }: ProfileProps) {
  const user = useAuthStore((state) => state.user);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);
  const [txs, setTxs] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return undefined;
      let cancelled = false;
      setLoading(true);
      void (async () => {
        try {
          await refreshUserProfile();
          const items = await getGamificationRepo().getCoinTransactions(user.id);
          if (!cancelled) setTxs(items);
        } catch {
          if (!cancelled) setTxs([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [user?.id, refreshUserProfile]),
  );

  return (
    <ProfileScreenShell title="T2T Coins" navigation={navigation}>
      <ProfileCoinsHero balance={user?.coins ?? 0} />
      {loading ? <CourseListSkeleton /> : null}
      {!loading && txs.length === 0 ? (
        <EmptyState
          title="Aún no ganaste coins"
          message="Tu historial aparecerá acá cuando completes lecciones o cursos."
          icon="wallet-outline"
        />
      ) : null}
      {txs.map((tx) => {
        const kind = classifyTx(tx);
        const tag = kind === 'streak' ? 'Racha' : kind === 'module' ? 'Módulo' : kind === 'spent' ? 'Gasto' : 'Capítulo';
        return (
          <ProfileCoinTxRow
            key={tx.id}
            kind={kind}
            amount={tx.amount}
            reason={tx.reason}
            caption={`${tag} · ${formatRelative(tx.createdAt)}`}
          />
        );
      })}
    </ProfileScreenShell>
  );
}

const DEFAULT_REFLECTION_PROMPT =
  'Identificá 3 momentos en los que tu liderazgo se notó esta semana. Reflexioná sobre por qué.';

function formatReflectionDate(date?: Date) {
  if (!date) return null;
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function WeeklyChallengeScreen({ navigation }: ProfileProps) {
  const [challenge, setChallenge] = useState<Awaited<
    ReturnType<ReturnType<typeof getGamificationRepo>['getWeeklyChallenge']>
  > | null>(null);
  const [existingReflection, setExistingReflection] = useState<Awaited<
    ReturnType<typeof loadWeeklyChallengeReflection>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const currentChallenge = await getGamificationRepo().getWeeklyChallenge();
        if (cancelled) return;
        setChallenge(currentChallenge);
        const challengeId = currentChallenge?.id ?? 'local_challenge';
        try {
          const saved = await loadWeeklyChallengeReflection(challengeId);
          if (!cancelled) setExistingReflection(saved);
        } catch {
          /* sin sesión: mostrar formulario vacío */
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const prompt = existingReflection?.prompt || DEFAULT_REFLECTION_PROMPT;
  const charCount = text.trim().length;
  const ready = charCount >= REFLECTION_MIN_CHARS;
  const alreadySent = existingReflection != null;
  const submittedAtLabel = formatReflectionDate(existingReflection?.submittedAt);

  const submit = async () => {
    if (!ready) {
      const missing = REFLECTION_MIN_CHARS - charCount;
      setStatus('error');
      setStatusMessage(`Escribí al menos ${missing} caracteres más para enviar.`);
      return;
    }
    setSubmitting(true);
    setStatus('idle');
    setStatusMessage('');
    try {
      const challengeId = challenge?.id ?? 'local_challenge';
      await submitWeeklyChallengeReflection({
        challengeId,
        prompt,
        text: text.trim(),
      });
      setExistingReflection({
        challengeId,
        prompt,
        text: text.trim(),
        submittedAt: new Date(),
      });
      setStatus('success');
      setStatusMessage('¡Gracias! Tu reflexión fue guardada.');
      Alert.alert('¡Gracias!', 'Tu reflexión fue enviada.', [
        { text: 'OK', onPress: () => profileGoBack(navigation) },
      ]);
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes('autenticado')
          ? 'Tenés que iniciar sesión para enviar tu reflexión.'
          : 'No pudimos guardar tu reflexión. Intentá de nuevo.';
      setStatus('error');
      setStatusMessage(message);
      Alert.alert('Error', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ProfileScreenShell title="Desafío semanal" navigation={navigation}>
        <ActivityIndicator color={Colors.accentPrimary} size="large" style={{ marginTop: Spacing.xxl }} />
      </ProfileScreenShell>
    );
  }

  return (
    <ProfileScreenShell
      title="Desafío semanal"
      navigation={navigation}
      footer={
        alreadySent ? (
          <Button title="Volver" variant="outline" onPress={() => profileGoBack(navigation)} />
        ) : (
          <View style={styles.reflectionFooter}>
            {statusMessage ? (
              <Text
                style={[
                  styles.reflectionStatus,
                  status === 'success' && styles.reflectionStatusSuccess,
                  status === 'error' && styles.reflectionStatusError,
                ]}
              >
                {statusMessage}
              </Text>
            ) : null}
            <Button
              title="Enviar mi reflexión"
              onPress={() => void submit()}
              loading={submitting}
            />
          </View>
        )
      }
    >
      <ProfileChallengeHero
        label="DESAFÍO DE LA SEMANA"
        title={challenge?.title || 'Tu liderazgo en acción'}
        reward={challenge?.xpReward ?? 50}
      />

      {alreadySent ? (
        <>
          <View style={styles.reflectionSentBanner}>
            <Ionicons name="checkmark-circle" size={22} color={Colors.accentHighlight} />
            <Text style={styles.reflectionSentTitle}>Ya enviaste tu reflexión</Text>
          </View>
          {submittedAtLabel ? (
            <Text style={styles.muted}>Enviada el {submittedAtLabel}</Text>
          ) : null}
          <Text style={styles.sectionH2}>Tu reflexión</Text>
          <Text style={styles.muted}>{prompt}</Text>
          <View style={styles.reflectionSentBody}>
            <Text style={styles.reflectionSentText}>{existingReflection.text}</Text>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.sectionH2}>Tu reflexión</Text>
          <Text style={styles.muted}>{prompt}</Text>

          <View style={styles.reflectionWrap}>
            <TextInput
              value={text}
              onChangeText={(value) => {
                setText(value);
                if (status !== 'idle') {
                  setStatus('idle');
                  setStatusMessage('');
                }
              }}
              multiline
              placeholder="Escribí tu reflexión…"
              placeholderTextColor={Colors.textTertiary}
              selectionColor={Colors.accentPrimary}
              style={styles.reflectionInput}
            />
            <Text style={[styles.reflectionCounter, ready && styles.reflectionCounterReady]}>
              {charCount} / {REFLECTION_MIN_CHARS} caracteres mínimos
            </Text>
          </View>
        </>
      )}
    </ProfileScreenShell>
  );
}

function groupNotificationsByDate(items: import('../../types').AppNotification[]) {
  const today: typeof items = [];
  const yesterday: typeof items = [];
  const week: typeof items = [];
  const older: typeof items = [];
  const now = Date.now();
  for (const item of items) {
    const diffMs = now - item.createdAt.getTime();
    const days = Math.floor(diffMs / 86_400_000);
    if (days <= 0) today.push(item);
    else if (days === 1) yesterday.push(item);
    else if (days < 7) week.push(item);
    else older.push(item);
  }
  return [
    { id: 'today', label: 'HOY', items: today },
    { id: 'yesterday', label: 'AYER', items: yesterday },
    { id: 'week', label: 'ESTA SEMANA', items: week },
    { id: 'older', label: 'ANTES', items: older },
  ].filter((g) => g.items.length > 0);
}

export function AppNotificationsScreen({ navigation }: ProfileProps) {
  const items = useNotificationStore((state) => state.items);
  const hasUnread = items.some((item) => !item.read);
  const groups = useMemo(() => groupNotificationsByDate(items), [items]);

  const markAllRead = () => {
    useNotificationStore.setState((state) => ({
      items: state.items.map((item) => ({ ...item, read: true })),
    }));
  };

  return (
    <ProfileScreenShell
      title="Notificaciones"
      navigation={navigation}
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
        groups.map((group) => (
          <View key={group.id}>
            <Text style={styles.notifGroupLabel}>{group.label}</Text>
            {group.items.map((item) => (
              <ProfileNotificationRow
                key={item.id}
                type={item.type}
                title={item.title}
                body={`${item.body} · ${formatRelative(item.createdAt)}`}
                unread={!item.read}
              />
            ))}
          </View>
        ))
      )}
    </ProfileScreenShell>
  );
}

export function SystemStatesScreen({ navigation }: ProfileProps) {
  const version = Constants.expoConfig?.version || '1.0.0';
  return (
    <ProfileScreenShell title="Ajustes" navigation={navigation}>
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
  redeemBlockedCard: {
    backgroundColor: 'rgba(42, 16, 82, 0.55)',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
    borderRadius: 20,
    padding: 20,
    marginVertical: Spacing.md,
    alignItems: 'center',
    gap: 8,
  },
  redeemBlockedIcon: {
    marginBottom: 4,
  },
  redeemBlockedTitle: {
    ...Typography.body,
    fontWeight: '800',
    fontSize: 17,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  redeemBlockedBody: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  muted: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  paymentRow: {
    marginBottom: Spacing.md,
    gap: 4,
  },
  paymentRowV2: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(42, 16, 82, 0.45)',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  paymentLabel: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontSize: 15,
  },
  paymentAmount: {
    ...Typography.h2,
    color: Colors.accentHighlight,
  },
  paymentAmountInline: {
    color: Colors.accentHighlight,
    fontWeight: '800',
    fontSize: 16,
  },
  paymentDate: {
    color: '#C2AAD6',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  sectionH2: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 18,
    marginTop: 8,
    marginBottom: 12,
  },
  paymentHero: {
    alignItems: 'center',
    backgroundColor: 'rgba(42, 16, 82, 0.45)',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  paymentHeroLabel: {
    color: '#C2AAD6',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  paymentHeroAmount: {
    color: Colors.accentHighlight,
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  paymentHeroDate: {
    color: '#C2AAD6',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  paymentInfo: {
    backgroundColor: 'rgba(42, 16, 82, 0.45)',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
    borderRadius: 20,
    paddingVertical: 4,
    marginBottom: 20,
  },
  paymentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  paymentInfoKey: {
    color: '#C2AAD6',
    fontSize: 14,
    fontWeight: '500',
  },
  paymentInfoVal: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  paymentInfoDiv: {
    height: 1,
    backgroundColor: '#FFFFFF14',
    marginHorizontal: 16,
  },
  mono: {
    fontFamily: 'Menlo',
  },
  diagnosticCta: {
    marginTop: 16,
  },
  radarWrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
  evoShareBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  evoShareText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  evoScript: {
    fontFamily: 'DreamingOutloud',
    color: Colors.accentHighlight,
    fontSize: 32,
    textAlign: 'center',
    marginTop: 4,
  },
  evoHeadline: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  evoLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 16,
  },
  evoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF14',
    borderWidth: 1,
    borderColor: '#FFFFFF22',
  },
  evoChipNow: {
    backgroundColor: '#4CC35B26',
    borderColor: '#4CC35B66',
  },
  evoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  evoChipText: {
    color: Colors.textPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  certCard: {
    backgroundColor: Colors.cream,
    borderRadius: 20,
    borderWidth: 6,
    borderColor: Colors.accentHighlight,
    padding: 28,
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  certSeal: {
    position: 'absolute',
    top: -12,
    right: -8,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accentHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.cream,
  },
  certBrand: {
    color: '#1A0030',
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 11,
  },
  certScript: {
    fontFamily: 'DreamingOutloud',
    color: Colors.accentHighlight,
    fontSize: 44,
  },
  certCaption: {
    color: '#777777',
    fontSize: 13,
  },
  certName: {
    color: '#1A0030',
    fontWeight: '900',
    fontSize: 26,
    textAlign: 'center',
  },
  certCourse: {
    color: Colors.accentHighlight,
    fontWeight: '800',
    fontSize: 18,
    textAlign: 'center',
  },
  certSign: {
    alignSelf: 'flex-end',
    marginTop: 14,
    alignItems: 'flex-end',
  },
  certSignature: {
    fontFamily: 'DreamingOutloud',
    color: '#1A0030',
    fontSize: 24,
  },
  certSignLabel: {
    color: '#777777',
    fontSize: 11,
  },
  comingSoonContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  reflectionWrap: {
    position: 'relative',
    marginTop: 10,
    marginBottom: 18,
  },
  reflectionInput: {
    minHeight: 160,
    backgroundColor: '#1F0A40CC',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    borderRadius: 16,
    padding: 16,
    paddingBottom: 32,
    color: Colors.textPrimary,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  reflectionCounter: {
    position: 'absolute',
    left: 14,
    bottom: 12,
    color: Colors.textTertiary,
    fontSize: 11,
  },
  reflectionCounterReady: {
    color: Colors.accentHighlight,
    fontWeight: '700',
  },
  reflectionFooter: {
    gap: 8,
  },
  reflectionStatus: {
    ...Typography.caption,
    textAlign: 'center',
    color: Colors.textSecondary,
  },
  reflectionStatusSuccess: {
    color: Colors.accentHighlight,
    fontWeight: '700',
  },
  reflectionStatusError: {
    color: Colors.accentOrangeWarm,
    fontWeight: '700',
  },
  reflectionSentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#4CC35B22',
    borderWidth: 1,
    borderColor: '#4CC35B55',
  },
  reflectionSentTitle: {
    ...Typography.bodyMedium,
    color: Colors.accentHighlight,
    fontWeight: '800',
    flex: 1,
  },
  reflectionSentBody: {
    minHeight: 160,
    backgroundColor: '#1F0A40CC',
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
  },
  reflectionSentText: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  notifGroupLabel: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginTop: 12,
    marginBottom: 8,
  },
  subActionsCol: {
    gap: 4,
    marginBottom: 12,
  },
  subActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  subActionBtn: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.bgPrimary,
    borderRadius: 22,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FFFFFF1A',
    gap: 12,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontWeight: '900',
    fontSize: 20,
  },
  changePlanToggle: {
    flexDirection: 'row',
    backgroundColor: '#1F0A40',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF14',
  },
  changePlanToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  changePlanToggleBtnActive: {
    backgroundColor: Colors.accentPrimary,
  },
  changePlanToggleText: {
    color: Colors.textTertiary,
    fontWeight: '700',
    fontSize: 13,
  },
  changePlanToggleTextActive: {
    color: Colors.textPrimary,
  },
  prorationHint: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  modalPlanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(42, 16, 82, 0.6)',
    borderWidth: 1,
    borderColor: '#FFFFFF1F',
    marginBottom: 8,
  },
  modalPlanRowDisabled: {
    opacity: 0.55,
  },
  modalPlanName: {
    color: Colors.textPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
  modalPlanMeta: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
});
