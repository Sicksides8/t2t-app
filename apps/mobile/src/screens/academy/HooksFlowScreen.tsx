import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { HookWelcomeVideo } from '../../components/HookWelcomeVideo';
import { HookPromoCode, HookSelectCard } from '../../components/hooks';
import { PenpotClosureScreen } from '../../components/onboarding';
import { TrainingFocusList } from '../../components/academy';
import { PenpotFlowShell, PenpotTopBar } from '../../components/penpot';
import { Button, CardGlass } from '../../components/ui';
import { plans } from '../../data/academy';
import { hookStepRequiresSelection, hooksFlowSteps, type HookStep } from '../../data/hooksFlow';
import type { Plan } from '../../types';
import * as authService from '../../services/authService';
import { redeemSubscriptionCode } from '../../services/subscriptionService';
import { useAcademyStore, useAuthStore } from '../../stores';
import { Colors, Radius, Spacing, Typography } from '../../theme';

const PROGRESS_TICK_MS = 900;

function interpolateTitle(title: string, displayName: string): string {
  return title.replace('{name}', displayName || 'Alumno T2T');
}

export function HooksFlowScreen() {
  const [step, setStep] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [hooksAnswers, setHooksAnswers] = useState<Record<string, string[]>>({});
  const [progressTaskIndex, setProgressTaskIndex] = useState(0);
  const user = useAuthStore((state) => state.user);
  const setOnboardingCompleted = useAuthStore((state) => state.setOnboardingCompleted);
  const diagnostic = useAcademyStore((state) => state.diagnostic);

  const steps = useMemo(() => {
    return hooksFlowSteps.map((s) => {
      if (s.kind !== 'planSelect') return s;
      return { ...s, planIds: plans.map((p) => p.id) };
    });
  }, []);

  const current = steps[step];
  const totalSteps = steps.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const stepCounter = `Paso ${step + 1} de ${totalSteps}`;

  useEffect(() => {
    if (user?.hookSelections && Object.keys(user.hookSelections).length > 0) {
      setHooksAnswers({ ...user.hookSelections });
    }
  }, [user?.id]);

  useEffect(() => {
    setSelectedIds(new Set());
    setProgressTaskIndex(0);
  }, [step]);

  const isProgressKind = current.kind === 'progress' || current.kind === 'socialProof';

  const persistAndAdvance = useCallback(
    async (skipSelectionCheck = false) => {
      const labels = resolveSelectionLabels(current, selectedIds);
      if (!skipSelectionCheck && hookStepRequiresSelection(current) && labels.length === 0) {
        return;
      }

      const merged = labels.length > 0 ? { ...hooksAnswers, [current.id]: labels } : hooksAnswers;
      if (labels.length > 0) setHooksAnswers(merged);

      const uid = useAuthStore.getState().user?.id;
      if (uid && labels.length > 0) {
        try {
          await authService.updateUserFields(uid, { hookSelections: merged });
          const u = useAuthStore.getState().user;
          if (u) useAuthStore.setState({ user: { ...u, hookSelections: merged } });
        } catch {
          /* offline */
        }
      }

      if (uid && current.kind === 'planSelect' && selectedIds.size > 0) {
        const planId = Array.from(selectedIds)[0];
        try {
          await authService.updateUserFields(uid, { selectedPlan: planId });
          const u = useAuthStore.getState().user;
          if (u) useAuthStore.setState({ user: { ...u, selectedPlan: planId } });
        } catch {
          /* offline */
        }
      }

      if (step === totalSteps - 1) {
        await setOnboardingCompleted(true);
        return;
      }

      if (current.id === '49_Canjear_Codigo' && promoCode.trim()) {
        try {
          await redeemSubscriptionCode(promoCode.trim());
        } catch {
          /* código inválido no bloquea */
        }
      }

      setStep((s) => s + 1);
    },
    [current, hooksAnswers, promoCode, selectedIds, setOnboardingCompleted, step, totalSteps],
  );

  useEffect(() => {
    if (!isProgressKind) return undefined;
    const taskCount = current.tasks.length;
    if (progressTaskIndex >= taskCount - 1) {
      const delay = current.autoAdvanceMs ?? 1200;
      const timer = setTimeout(() => {
        void persistAndAdvance(true);
      }, delay);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setProgressTaskIndex((i) => i + 1), PROGRESS_TICK_MS);
    return () => clearTimeout(timer);
  }, [step, progressTaskIndex, isProgressKind, current, persistAndAdvance]);

  const toggleOption = (optionId: string) => {
    if (current.kind !== 'select' && current.kind !== 'planSelect') return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (current.kind === 'select' && current.multiSelect) {
        if (next.has(optionId)) next.delete(optionId);
        else next.add(optionId);
      } else {
        next.clear();
        next.add(optionId);
      }
      return next;
    });
  };

  const canContinue =
    !hookStepRequiresSelection(current) || selectedIds.size > 0 || current.kind === 'promo';

  const primaryLabel =
    step === totalSteps - 1 ? 'Entrar a T2T Academy' : current.kind === 'promo' ? 'Continuar' : 'Continuar';

  if (current.kind === 'closure') {
    return (
      <PenpotClosureScreen
        frame={{
          id: current.id,
          penId: current.penId,
          title: current.title,
          body: current.body,
          orbVariant: 'default',
          illustrationKey: 'closure',
        }}
        progress={progress}
        primaryLabel={primaryLabel}
        onNext={() => void persistAndAdvance(true)}
      >
        {current.summarySkillsLabel ? (
          <Text style={styles.closureSection}>{current.summarySkillsLabel}</Text>
        ) : null}
        <TrainingFocusList skillIds={diagnostic.topSkills.length ? diagnostic.topSkills : ['liderazgo', 'comunicacion']} />
      </PenpotClosureScreen>
    );
  }

  return (
    <PenpotFlowShell scroll orbVariant="default" contentStyle={styles.hooksShell}>
      <PenpotTopBar title={stepCounter} progress={progress} />
      {renderStepBody(current, {
        displayName: user?.displayName || 'Alumno T2T',
        selectedIds,
        toggleOption,
        promoCode,
        setPromoCode,
        progressTaskIndex,
        planOptions: plans,
        topSkills: diagnostic.topSkills.length ? diagnostic.topSkills : ['liderazgo', 'comunicacion'],
      })}
      {!isProgressKind ? (
        <>
          {current.kind === 'welcomeVideo' ? (
            <Button title="Saltar video" variant="ghost" onPress={() => void persistAndAdvance(true)} />
          ) : null}
          <Button
            title={primaryLabel}
            disabled={!canContinue}
            onPress={() => void persistAndAdvance(current.kind === 'promo')}
          />
        </>
      ) : null}
    </PenpotFlowShell>
  );
}

function resolveSelectionLabels(step: HookStep, selectedIds: Set<string>): string[] {
  if (step.kind === 'select') {
    return step.options.filter((o) => selectedIds.has(o.id)).map((o) => o.label);
  }
  if (step.kind === 'planSelect') {
    return plans.filter((p) => selectedIds.has(p.id)).map((p) => p.name);
  }
  return [];
}

function renderStepBody(
  step: HookStep,
  ctx: {
    displayName: string;
    selectedIds: Set<string>;
    toggleOption: (id: string) => void;
    promoCode: string;
    setPromoCode: (v: string) => void;
    progressTaskIndex: number;
    planOptions: Plan[];
    topSkills: string[];
  },
) {
  switch (step.kind) {
    case 'select':
      return (
        <>
          <Text style={styles.title}>{step.title}</Text>
          {step.subtitle ? <Text style={styles.subtitle}>{step.subtitle}</Text> : null}
          <View style={styles.selectGrid}>
            {step.options.map((opt) => (
              <HookSelectCard
                key={opt.id}
                label={opt.label}
                icon={opt.icon}
                selected={ctx.selectedIds.has(opt.id)}
                onPress={() => ctx.toggleOption(opt.id)}
              />
            ))}
          </View>
        </>
      );

    case 'planSelect':
      return (
        <>
          <Text style={styles.title}>{step.title}</Text>
          {step.subtitle ? <Text style={styles.subtitle}>{step.subtitle}</Text> : null}
          <View style={styles.selectGrid}>
            {ctx.planOptions.map((plan) => (
              <HookSelectCard
                key={plan.id}
                label={plan.name}
                subtitle={plan.features.slice(0, 2).join(' · ')}
                selected={ctx.selectedIds.has(plan.id)}
                onPress={() => ctx.toggleOption(plan.id)}
              />
            ))}
          </View>
        </>
      );

    case 'badge':
      return (
        <View style={styles.badgeWrap}>
          <View style={styles.badgeGlow} />
          <LinearGradient colors={['#FFD740', '#FF9800']} style={styles.badgeMedal}>
            <Ionicons name="star" size={72} color={Colors.bgPrimary} />
          </LinearGradient>
          <Text style={styles.badgeHeadline}>{step.headline}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
          <View style={styles.badgeChip}>
            <Ionicons name="flame" size={18} color="#FF9800" />
            <Text style={styles.badgeChipText}>{step.badgeName}</Text>
          </View>
          <Text style={styles.badgeReason}>{step.badgeReason}</Text>
        </View>
      );

    case 'interstitial':
      return (
        <View style={styles.interstitialWrap}>
          <View
            style={[
              styles.interstitialOrb,
              step.iconTint === 'secondary' ? styles.orbSecondary : styles.orbPrimary,
            ]}
          >
            <Ionicons
              name={step.icon}
              size={72}
              color={step.iconTint === 'secondary' ? Colors.accentSecondary : Colors.accentPrimary}
            />
          </View>
          <Text style={styles.titleCenter}>{interpolateTitle(step.title, ctx.displayName)}</Text>
          <Text style={styles.subtitleCenter}>{step.body}</Text>
        </View>
      );

    case 'progress':
      return (
        <>
          <Text style={styles.title}>{step.title}</Text>
          {step.subtitle ? <Text style={styles.subtitle}>{step.subtitle}</Text> : null}
          <View style={styles.taskList}>
            {step.tasks.map((task, index) => (
              <HookTaskRow
                key={task}
                label={task}
                done={index < ctx.progressTaskIndex}
                active={index === ctx.progressTaskIndex}
              />
            ))}
          </View>
        </>
      );

    case 'socialProof':
      return (
        <>
          <Text style={styles.title}>{step.title}</Text>
          <View style={styles.taskList}>
            {step.tasks.map((task, index) => (
              <HookTaskRow
                key={task}
                label={task}
                done={index <= ctx.progressTaskIndex}
                active={index === ctx.progressTaskIndex}
                showPercent
              />
            ))}
          </View>
          <Text style={styles.statHeadline}>{step.statHeadline}</Text>
          <CardGlass style={styles.testimonial}>
            <View style={styles.testimonialHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{step.testimonial.initials}</Text>
              </View>
              <Text style={styles.testimonialName}>{step.testimonial.name}</Text>
            </View>
            <Text style={styles.testimonialQuote}>"{step.testimonial.quote}"</Text>
          </CardGlass>
        </>
      );

    case 'promo':
      return (
        <>
          <Text style={styles.title}>{step.title}</Text>
          <HookPromoCode subtitle={step.subtitle} value={ctx.promoCode} onChangeText={ctx.setPromoCode} />
        </>
      );

    case 'welcomeVideo':
      return (
        <>
          <Text style={styles.title}>{step.title}</Text>
          <HookWelcomeVideo
            durationLabel={step.durationLabel}
            scriptLine={step.scriptLine}
            headline={step.headline}
            authorName={step.authorName}
            authorRole={step.authorRole}
            videoUrl={step.videoUrl}
          />
        </>
      );

    default:
      return null;
  }
}

function HookTaskRow({
  label,
  done,
  active,
  showPercent,
}: {
  label: string;
  done: boolean;
  active: boolean;
  showPercent?: boolean;
}) {
  const fill = done ? 1 : active ? 0.55 : 0.12;
  return (
    <View style={styles.taskRow}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskLabel}>{label}</Text>
        {showPercent ? (
          <Text style={styles.taskPercent}>{done ? '100%' : active ? '…' : '0%'}</Text>
        ) : done ? (
          <Ionicons name="checkmark-circle" size={22} color={Colors.accentSecondary} />
        ) : null}
      </View>
      <View style={styles.taskTrack}>
        <View style={[styles.taskFill, { width: `${fill * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hooksShell: {
    paddingBottom: Spacing.xl,
  },
  topRow: {
    marginBottom: Spacing.sm,
  },
  stepCounter: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  title: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  titleCenter: {
    ...Typography.h1,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  subtitleCenter: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  selectGrid: {
    gap: Spacing.md,
    marginVertical: Spacing.xl,
  },
  selectPressable: {
    borderRadius: Radius.cardLg,
  },
  pressed: {
    opacity: 0.9,
  },
  selectCard: {
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  selectCardActive: {
    borderWidth: 2,
    borderColor: Colors.accentPrimary,
    backgroundColor: Colors.bgSurface,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  selectTextCol: {
    flex: 1,
  },
  selectLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  selectSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  badgeWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  badgeGlow: {
    position: 'absolute',
    top: 40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFA72640',
  },
  badgeMedal: {
    width: 160,
    height: 160,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF9800',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  badgeHeadline: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: '#FF9800',
    backgroundColor: '#FF980033',
  },
  badgeChipText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '800',
    letterSpacing: 1,
  },
  badgeReason: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  interstitialWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.lg,
  },
  interstitialOrb: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  orbPrimary: {
    backgroundColor: '#B73CEF26',
    borderColor: '#B73CEF66',
  },
  orbSecondary: {
    backgroundColor: '#4CC35B26',
    borderColor: '#4CC35B66',
  },
  taskList: {
    gap: Spacing.lg,
    marginVertical: Spacing.xl,
  },
  taskRow: {
    gap: Spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  taskPercent: {
    ...Typography.caption,
    color: Colors.accentSecondary,
    fontWeight: '700',
  },
  taskTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: Colors.divider,
    overflow: 'hidden',
  },
  taskFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: Colors.accentSecondary,
  },
  statHeadline: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  testimonial: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.caption,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  testimonialName: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  testimonialQuote: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  cardLabel: {
    ...Typography.bodyMedium,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  input: {
    marginTop: Spacing.md,
    borderRadius: Radius.chip,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.divider,
    color: Colors.textPrimary,
    backgroundColor: Colors.bgSurface,
  },
  closureWrap: {
    gap: 0,
    paddingBottom: Spacing.lg,
  },
  closureHero: {
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  closureOrb: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.glass,
    borderWidth: 1,
    borderColor: Colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closureTitle: {
    ...Typography.h1,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  closureSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.sm,
  },
  closureSection: {
    ...Typography.h2,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
});
