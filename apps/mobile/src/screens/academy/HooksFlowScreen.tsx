import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PenpotFlowShell, PenpotTopBar } from '../../components/penpot';
import { Button } from '../../components/ui';
import {
  HookAgeSelect,
  HookBadge,
  HookChipGrid,
  HookConfirmPlan,
  HookConfirmPlanFooter,
  HookIconSelectList,
  HookInterstitialOrb,
  HookNameInput,
  HookPersonalizedPlan,
  HookPlanReady,
  HookPricingScreen,
  HookProgressWithQuestion,
  HookRedeemCode,
  HookSocialProof,
  HookSpecialOffer,
  HookWelcomeVideoIntro,
} from '../../components/hooks';
import {
  countedSteps,
  findStepIndexById,
  hookStepRequiresSelection,
  hooksFlowSteps,
  type HookPricingPlan,
  type HookStep,
} from '../../data/hooksFlow';
import * as authService from '../../services/authService';
import { getBillingProvider } from '../../services/subscriptionService';
import { applyCouponToUser } from '../../services/couponService';
import { useAuthStore } from '../../stores';
import { Colors, Spacing } from '../../theme';
import type { SubscriptionSource } from '../../types';

const PROGRESS_TICK_MS = 900;
const SOCIAL_PROOF_AUTO_MS = 3200;

type BranchState =
  | { kind: 'main' }
  | { kind: 'redeem' }
  | { kind: 'codeApplied' }
  | { kind: 'final' };

export function HooksFlowScreen() {
  const [step, setStep] = useState(0);
  const [branch, setBranch] = useState<BranchState>({ kind: 'main' });
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerShownOnce, setOfferShownOnce] = useState(false);
  const [name, setName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [questionAnswered, setQuestionAnswered] = useState(false);
  const [progressTaskIndex, setProgressTaskIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [hooksAnswers, setHooksAnswers] = useState<Record<string, string[]>>({});
  const [selectedPlanId, setSelectedPlanId] = useState<HookPricingPlan['id'] | null>(null);
  const user = useAuthStore((state) => state.user);
  const setOnboardingCompleted = useAuthStore((state) => state.setOnboardingCompleted);
  const refreshUserProfile = useAuthStore((state) => state.refreshUserProfile);

  // helpers
  const steps = hooksFlowSteps;
  const counted = useMemo(() => countedSteps(steps), [steps]);

  // Branch resolution: if we are in a branch we render that instead of the linear step
  const current: HookStep = useMemo(() => {
    if (branch.kind === 'redeem') {
      const s = steps[findStepIndexById('54_Canjear_Codigo', steps)];
      return s;
    }
    if (branch.kind === 'codeApplied') {
      return steps[findStepIndexById('55_Codigo_Aplicado', steps)];
    }
    if (branch.kind === 'final') {
      return steps[findStepIndexById('53_Plan_Personalizado', steps)];
    }
    return steps[step];
  }, [branch, step, steps]);

  // Counter visible in top bar
  const counterIndex = current.counted
    ? counted.findIndex((s) => s.id === current.id) + 1
    : 0;
  const counterTotal = counted.length;
  const progress = current.counted ? (counterIndex / counterTotal) * 100 : 0;
  const showCounter =
    current.counted && current.kind !== 'pricing' && current.kind !== 'confirmPlan';
  const hideProgress = !current.counted || !showCounter;

  // Top bar title
  const topBarTitle = (() => {
    if (showCounter) return `Paso ${counterIndex} de ${counterTotal}`;
    switch (current.kind) {
      case 'pricing':
        return current.title;
      case 'confirmPlan':
        return current.title;
      case 'redeemCode':
        return 'Canjear código';
      case 'personalizedPlan':
        return current.title;
      case 'welcomeVideo':
        return undefined;
      default:
        return undefined;
    }
  })();

  // Reset transient state when step / branch changes
  useEffect(() => {
    setSelectedIds(new Set());
    setProgressTaskIndex(0);
    setQuestionAnswered(false);
  }, [step, branch.kind, current.id]);

  // Load saved hooksAnswers from user
  useEffect(() => {
    if (user?.hookSelections && Object.keys(user.hookSelections).length > 0) {
      setHooksAnswers({ ...user.hookSelections });
    }
    if (user?.displayName) setName(user.displayName);
  }, [user?.id, user?.displayName, user?.hookSelections]);

  const persistSelection = useCallback(
    async (labels: string[]) => {
      if (labels.length === 0) return;
      const merged = { ...hooksAnswers, [current.id]: labels };
      setHooksAnswers(merged);
      const uid = useAuthStore.getState().user?.id;
      if (!uid) return;
      try {
        await authService.updateUserFields(uid, { hookSelections: merged });
        const u = useAuthStore.getState().user;
        if (u) useAuthStore.setState({ user: { ...u, hookSelections: merged } });
      } catch {
        /* offline */
      }
    },
    [current.id, hooksAnswers],
  );

  const resolveSelectionLabels = useCallback((): string[] => {
    if (current.kind === 'iconSelect') {
      return current.options.filter((o) => selectedIds.has(o.id)).map((o) => o.label);
    }
    if (current.kind === 'chipSelect') {
      const main = selectedIds.has(current.chipMain.id) ? [current.chipMain.label] : [];
      const rest = current.chips.filter((c) => selectedIds.has(c.id)).map((c) => c.label);
      return [...main, ...rest];
    }
    if (current.kind === 'ageSelect') {
      return selectedIds.size > 0 ? Array.from(selectedIds) : [];
    }
    if (current.kind === 'nameInput') {
      return name.trim() ? [name.trim()] : [];
    }
    return [];
  }, [current, selectedIds, name]);

  const persistName = useCallback(async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const uid = useAuthStore.getState().user?.id;
    if (!uid) return;
    try {
      await authService.updateUserFields(uid, { displayName: trimmed });
      const u = useAuthStore.getState().user;
      if (u) useAuthStore.setState({ user: { ...u, displayName: trimmed } });
    } catch {
      /* offline */
    }
  }, [name]);

  const advanceLinear = useCallback(() => {
    setStep((s) => s + 1);
  }, []);

  const enterFinal = useCallback(() => {
    setBranch({ kind: 'final' });
  }, []);

  const finishHooks = useCallback(async () => {
    await setOnboardingCompleted(true);
  }, [setOnboardingCompleted]);

  /**
   * Activa el trial de 7 días vía el provider activo (mock en Fase 1) y
   * avanza a la pantalla final del hooks flow.
   *
   * TODO MERCADOPAGO: cuando el provider real esté conectado, este flujo
   * disparará IAP nativo (iOS/Android) o el redirect a MercadoPago antes
   * de persistir. La interfaz se mantiene igual.
   */
  const startTrialAndFinish = useCallback(
    async (source: SubscriptionSource) => {
      const uid = useAuthStore.getState().user?.id;
      if (!uid) {
        enterFinal();
        return;
      }
      const planId = selectedPlanId && selectedPlanId !== 'free' ? selectedPlanId : 'pro';
      try {
        await getBillingProvider().startTrial(uid, planId);
        await authService.updateUserFields(uid, { subscriptionSource: source });
        await refreshUserProfile();
      } catch {
        // Si el provider falla no bloqueamos el onboarding — el user puede
        // re-intentar desde el paywall en el catálogo.
      }
      enterFinal();
    },
    [enterFinal, refreshUserProfile, selectedPlanId],
  );

  const persistAndAdvance = useCallback(
    async (skipSelectionCheck = false) => {
      // Required selection check
      const labels = resolveSelectionLabels();
      const requiresSelection = hookStepRequiresSelection(current);
      if (!skipSelectionCheck && requiresSelection) {
        if (current.kind === 'nameInput' && !name.trim()) return;
        if (current.kind !== 'nameInput' && selectedIds.size === 0) return;
      }
      if (labels.length > 0) await persistSelection(labels);
      if (current.kind === 'nameInput') await persistName();

      // Confirm plan: el footer Apple/Google dispara startTrialAndFinish directo.
      // Si llegamos acá sin pasar por esos botones (caso defensivo) caemos al
      // final sin activar suscripción.
      if (current.kind === 'confirmPlan') {
        enterFinal();
        return;
      }

      // After welcome video, mark onboarding done
      if (current.kind === 'welcomeVideo') {
        await finishHooks();
        return;
      }

      // Personalized plan -> next is welcome video step (last)
      if (current.kind === 'personalizedPlan') {
        const idx = findStepIndexById('56_Welcome_Video_Autor', steps);
        if (idx >= 0) {
          setBranch({ kind: 'main' });
          setStep(idx);
        } else {
          await finishHooks();
        }
        return;
      }

      // Redeem branch -> aplica el cupón vía couponService (provider-aware)
      if (current.kind === 'redeemCode') {
        const uid = useAuthStore.getState().user?.id;
        if (promoCode.trim() && uid) {
          const result = await applyCouponToUser(uid, promoCode.trim());
          if (result.ok) {
            await refreshUserProfile();
          }
          // TODO MERCADOPAGO: mostrar `result.message` en un toast/alert al
          // user (ej. "Cupón no válido", "Trial extendido 30 días").
        }
        setBranch({ kind: 'codeApplied' });
        return;
      }

      // Code applied -> jump to personalized plan
      if (current.kind === 'codeApplied') {
        enterFinal();
        return;
      }

      advanceLinear();
    },
    [
      advanceLinear,
      current,
      enterFinal,
      finishHooks,
      name,
      persistName,
      persistSelection,
      promoCode,
      refreshUserProfile,
      resolveSelectionLabels,
      selectedIds,
      steps,
    ],
  );

  // Progress kinds auto-advance the task index
  useEffect(() => {
    if (current.kind !== 'progressWithQuestion') return undefined;
    if (progressTaskIndex >= current.tasks.length - 1) return undefined;
    const t = setTimeout(() => setProgressTaskIndex((i) => i + 1), PROGRESS_TICK_MS);
    return () => clearTimeout(t);
  }, [current, progressTaskIndex]);

  // socialProof: auto-advance after a delay
  useEffect(() => {
    if (current.kind !== 'socialProof') return undefined;
    const t = setTimeout(() => void persistAndAdvance(true), SOCIAL_PROOF_AUTO_MS);
    return () => clearTimeout(t);
  }, [current, persistAndAdvance]);

  const toggleOption = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (current.kind === 'iconSelect') {
        if (current.multiSelect) {
          if (next.has(id)) next.delete(id);
          else next.add(id);
        } else {
          next.clear();
          next.add(id);
        }
      } else if (current.kind === 'chipSelect') {
        if (next.has(id)) next.delete(id);
        else next.add(id);
      } else if (current.kind === 'ageSelect') {
        next.clear();
        next.add(id);
      }
      return next;
    });
  }, [current]);

  const canContinue = (() => {
    if (current.kind === 'iconSelect') return selectedIds.size > 0;
    if (current.kind === 'chipSelect') return selectedIds.size > 0;
    if (current.kind === 'ageSelect') return selectedIds.size > 0;
    if (current.kind === 'nameInput') return name.trim().length > 0;
    if (current.kind === 'pricing') return selectedPlanId !== null;
    return true;
  })();

  const onSkip = useCallback(() => {
    void persistAndAdvance(true);
  }, [persistAndAdvance]);

  // Back behavior. Confirm plan back triggers offer once.
  const onBack = useCallback(() => {
    if (current.kind === 'confirmPlan' && !offerShownOnce) {
      setOfferShownOnce(true);
      setShowOfferModal(true);
      return;
    }
    if (branch.kind === 'redeem') {
      setBranch({ kind: 'main' });
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  }, [branch.kind, current.kind, offerShownOnce]);

  const skipLabel = (() => {
    if (current.kind === 'iconSelect') return 'Omitir';
    if (current.kind === 'chipSelect') return 'Omitir';
    if (current.kind === 'ageSelect') return 'Omitir';
    if (current.kind === 'nameInput') return 'Omitir';
    return undefined;
  })();

  // Render
  const showTopBar = current.kind !== 'welcomeVideo';
  const showPrimaryButton =
    current.kind !== 'progressWithQuestion' &&
    current.kind !== 'socialProof' &&
    current.kind !== 'welcomeVideo' &&
    current.kind !== 'specialOffer' &&
    current.kind !== 'confirmPlan' &&
    current.kind !== 'badge' &&
    current.kind !== 'planReady' &&
    current.kind !== 'codeApplied' &&
    current.kind !== 'personalizedPlan';

  const primaryLabel = (() => {
    if (current.kind === 'pricing') return current.ctaLabel;
    if (current.kind === 'redeemCode') return current.ctaLabel;
    return 'Continuar';
  })();

  // Build the fixed footer based on the current step kind so that the CTA
  // stays anchored at the bottom across transitions.
  const footerNode = (() => {
    if (showPrimaryButton) {
      return (
        <Button
          title={primaryLabel}
          disabled={!canContinue}
          onPress={() => void persistAndAdvance(false)}
        />
      );
    }
    switch (current.kind) {
      case 'badge':
        return (
          <Button title={current.ctaLabel || 'Continuar'} onPress={() => void persistAndAdvance(true)} />
        );
      case 'planReady':
        return <Button title={current.ctaLabel} onPress={() => void persistAndAdvance(true)} />;
      case 'codeApplied':
        return <Button title={current.ctaLabel} onPress={() => void persistAndAdvance(true)} />;
      case 'personalizedPlan':
        return <Button title={current.ctaLabel} onPress={() => void persistAndAdvance(true)} />;
      case 'welcomeVideo':
        return <Button title={current.ctaLabel} onPress={() => void persistAndAdvance(true)} />;
      case 'confirmPlan':
        return (
          <HookConfirmPlanFooter
            appleCtaLabel={current.appleCtaLabel}
            googleCtaLabel={current.googleCtaLabel}
            footnote={current.footnote}
            onApple={() => void startTrialAndFinish('apple')}
            onGoogle={() => void startTrialAndFinish('google')}
          />
        );
      default:
        return null;
    }
  })();

  const headerNode = showTopBar ? (
    <PenpotTopBar
      title={topBarTitle}
      progress={current.counted ? progress : undefined}
      hideProgress={hideProgress}
      onBack={onBack}
      rightLabel={skipLabel}
      onRightPress={skipLabel ? onSkip : undefined}
    />
  ) : null;

  return (
    <PenpotFlowShell
      scroll
      orbVariant="default"
      contentStyle={styles.hooksShell}
      header={headerNode}
      footer={footerNode}
    >
      {renderStepBody({
        step: current,
        selectedIds,
        toggleOption,
        progressTaskIndex,
        questionAnswered,
        setQuestionAnswered: (v) => setQuestionAnswered(v),
        onAdvance: () => void persistAndAdvance(true),
        name,
        setName,
        promoCode,
        setPromoCode,
        selectedPlanId,
        setSelectedPlanId,
        onRedeemTap: () => setBranch({ kind: 'redeem' }),
        onApple: () => void startTrialAndFinish('apple'),
        onGoogle: () => void startTrialAndFinish('google'),
        onWelcomeSkip: () => void finishHooks(),
      })}

      {/* Special Offer modal */}
      {current.kind === 'confirmPlan' ? (
        <HookSpecialOffer
          visible={showOfferModal}
          discountLabel={(steps.find((s) => s.kind === 'specialOffer' && s.counted === false) as any)?.discountLabel || '25% OFF'}
          headline="Oferta por única vez"
          subtitle="Solo para los próximos 15 minutos"
          pricePitch="Entrenamientos personalizados por solo"
          priceMain="USD 2,15 /mes"
          priceFootnote="Facturado anualmente en USD 25.90"
          durationMs={15 * 60 * 1000}
          ctaLabel="Continuar con descuento"
          restoreLabel="Restaurar compras"
          onAccept={() => {
            setShowOfferModal(false);
          }}
          onRestore={() => setShowOfferModal(false)}
          onClose={() => setShowOfferModal(false)}
        />
      ) : null}
    </PenpotFlowShell>
  );
}

type RenderCtx = {
  step: HookStep;
  selectedIds: Set<string>;
  toggleOption: (id: string) => void;
  progressTaskIndex: number;
  questionAnswered: boolean;
  setQuestionAnswered: (v: boolean) => void;
  onAdvance: () => void;
  name: string;
  setName: (v: string) => void;
  promoCode: string;
  setPromoCode: (v: string) => void;
  selectedPlanId: HookPricingPlan['id'] | null;
  setSelectedPlanId: (v: HookPricingPlan['id']) => void;
  onRedeemTap: () => void;
  onApple: () => void;
  onGoogle: () => void;
  onWelcomeSkip: () => void;
};

function renderStepBody(ctx: RenderCtx) {
  const { step } = ctx;
  switch (step.kind) {
    case 'iconSelect':
      return (
        <View style={styles.bodySection}>
          <Text style={styles.title}>{step.title}</Text>
          {step.subtitle ? <Text style={styles.subtitle}>{step.subtitle}</Text> : null}
          <View style={{ marginTop: Spacing.lg }}>
            <HookIconSelectList
              options={step.options}
              selectedIds={ctx.selectedIds}
              onToggle={ctx.toggleOption}
            />
          </View>
        </View>
      );
    case 'chipSelect':
      return (
        <View style={styles.bodySection}>
          <Text style={styles.title}>{step.title}</Text>
          {step.subtitle ? <Text style={styles.subtitle}>{step.subtitle}</Text> : null}
          <View style={{ marginTop: Spacing.lg }}>
            <HookChipGrid
              chipMain={step.chipMain}
              chips={step.chips}
              selectedIds={ctx.selectedIds}
              onToggle={ctx.toggleOption}
            />
          </View>
        </View>
      );
    case 'badge':
      return (
        <HookBadge
          headline={step.headline}
          subtitle={step.subtitle}
          badgeName={step.badgeName}
          badgeReason={step.badgeReason}
        />
      );
    case 'interstitial':
      return <HookInterstitialOrb icon={step.icon} title={step.title} body={step.body} />;
    case 'progressWithQuestion':
      return (
        <HookProgressWithQuestion
          title={step.title}
          subtitle={step.subtitle}
          tasks={step.tasks}
          activeIndex={ctx.progressTaskIndex}
          question={step.question}
          showQuestion={ctx.progressTaskIndex >= step.tasks.length - 1 && !ctx.questionAnswered}
          onAnswer={() => {
            ctx.setQuestionAnswered(true);
            setTimeout(() => ctx.onAdvance(), 280);
          }}
        />
      );
    case 'socialProof':
      return (
        <HookSocialProof
          title={step.title}
          tasks={step.tasks}
          statHeadline={step.statHeadline}
          testimonial={step.testimonial}
        />
      );
    case 'planReady':
      return <HookPlanReady content={step.content} icon="trophy" />;
    case 'codeApplied':
      return <HookPlanReady content={step.content} icon="gift" />;
    case 'pricing':
      return (
        <View style={styles.bodySection}>
          <HookPricingScreen
            plans={step.plans}
            stats={step.stats}
            defaultPeriod={step.defaultPeriod}
            selectedPlanId={ctx.selectedPlanId}
            onSelectPlan={ctx.setSelectedPlanId}
          />
          <Text style={styles.pricingFootnote}>{step.footnote}</Text>
        </View>
      );
    case 'ageSelect':
      return (
        <View style={styles.bodySection}>
          <Text style={styles.title}>{step.title}</Text>
          {step.subtitle ? <Text style={styles.subtitle}>{step.subtitle}</Text> : null}
          <View style={{ marginTop: Spacing.lg }}>
            <HookAgeSelect
              ranges={step.ranges}
              selectedId={ctx.selectedIds.size ? Array.from(ctx.selectedIds)[0] : null}
              onSelect={ctx.toggleOption}
            />
          </View>
        </View>
      );
    case 'nameInput':
      return (
        <HookNameInput
          preScript={step.preScript}
          title={step.title}
          placeholder={step.placeholder}
          caption={step.caption}
          value={ctx.name}
          onChangeText={ctx.setName}
        />
      );
    case 'confirmPlan':
      return (
        <HookConfirmPlan
          planLabel={step.planLabel}
          trialDays={step.trialDays}
          trialCaption={step.trialCaption}
          afterPricing={step.afterPricing}
          redeemCtaLabel={step.redeemCtaLabel}
          onRedeem={ctx.onRedeemTap}
        />
      );
    case 'redeemCode':
      return (
        <HookRedeemCode
          title={step.title}
          subtitle={step.subtitle}
          placeholder={step.placeholder}
          infoBody={step.infoBody}
          value={ctx.promoCode}
          onChangeText={ctx.setPromoCode}
        />
      );
    case 'personalizedPlan':
      return (
        <HookPersonalizedPlan
          coachName={step.coachName}
          coachInitials={step.coachInitials}
          scriptLine={step.scriptLine}
          bodyLine={step.bodyLine}
          packsTitle={step.packsTitle}
          packs={step.packs}
          routeTitle={step.routeTitle}
          route={step.route}
        />
      );
    case 'welcomeVideo':
      return (
        <HookWelcomeVideoIntro
          durationLabel={step.durationLabel}
          scriptLine={step.scriptLine}
          headline={step.headline}
          authorName={step.authorName}
          authorRole={step.authorRole}
          videoUrl={step.videoUrl}
          skipLabel={step.skipLabel}
          onSkip={ctx.onWelcomeSkip}
        />
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  hooksShell: {
    paddingBottom: Spacing.xl,
  },
  bodySection: {
    paddingTop: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 30,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  pricingFootnote: {
    textAlign: 'center',
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 14,
  },
});
