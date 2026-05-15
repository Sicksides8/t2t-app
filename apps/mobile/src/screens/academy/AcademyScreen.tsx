import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiagnosticResultCarousel } from '../../components/diagnostic';
import { DiagnosticQuestionScreen } from '../../components/diagnostic/DiagnosticQuestionScreen';
import { OnboardingStorySlide, PenpotClosureScreen, SplashPenpotScreen } from '../../components/onboarding';
import { PenpotFlowShell, PenpotThinkingScreen } from '../../components/penpot';
import { Button } from '../../components/ui';
import {
  diagnosticQuestions,
  onboardingThinkingFrames,
  REFLEXION_AFTER_QUESTION_INDEX,
} from '../../data/diagnostic';
import { getPenpotFrame, PENPOT_FRAMES, storyFrameIds } from '../../data/penpotFrames';
import { saveDiagnosticResult } from '../../services/diagnosticService';
import { useAcademyStore, useAuthStore } from '../../stores';
import type { RootStackParamList } from '../../types';

export { HooksFlowScreen as HooksFlow } from './HooksFlowScreen';
export { CourseDetailScreen } from './CourseDetailScreen';
export { HomeScreen } from './HomeScreen';
export { ExploreScreen } from './ExploreScreen';
export { MyCoursesScreen } from './MyCoursesScreen';
export { VideoPlayerScreen } from './VideoPlayerScreen';
export { SkillCatalogScreen } from './SkillCatalogScreen';

const LOADING_STEP_MS = 1400;

type OnboardingStep =
  | { kind: 'splash' }
  | { kind: 'welcome' }
  | { kind: 'story'; frameId: (typeof storyFrameIds)[number] }
  | { kind: 'question'; index: number }
  | { kind: 'thinking'; index: number }
  | { kind: 'result' }
  | { kind: 'closure' };

function buildOnboardingSteps(): OnboardingStep[] {
  const steps: OnboardingStep[] = [{ kind: 'splash' }, { kind: 'welcome' }];
  for (const frameId of storyFrameIds) {
    steps.push({ kind: 'story', frameId });
  }
  diagnosticQuestions.forEach((_, index) => {
    steps.push({ kind: 'question', index });
    if (index === REFLEXION_AFTER_QUESTION_INDEX) {
      steps.push({ kind: 'thinking', index: 0 });
    }
  });
  for (let i = 1; i < onboardingThinkingFrames.length; i += 1) {
    steps.push({ kind: 'thinking', index: i });
  }
  steps.push({ kind: 'result' }, { kind: 'closure' });
  return steps;
}

const ONBOARDING_STEPS = buildOnboardingSteps();

/** Penpot: 01_Splash */
export function SplashScreen({ navigation }: Partial<NativeStackScreenProps<RootStackParamList, 'Bootstrap'>>) {
  return <SplashPenpotScreen onComplete={() => navigation?.navigate('Onboarding')} />;
}

/** Flujo onboarding + diagnóstico Penpot 01–31 */
export function OnboardingFlow({ navigation }: Partial<NativeStackScreenProps<RootStackParamList, 'Onboarding'>>) {
  const [stepIndex, setStepIndex] = useState(0);
  const resultInitialized = useRef(false);
  const setAnswer = useAcademyStore((state) => state.setAnswer);
  const completeDiagnostic = useAcademyStore((state) => state.completeDiagnostic);
  const diagnostic = useAcademyStore((state) => state.diagnostic);
  const hasSeenOnboarding = useAuthStore((state) => state.setHasSeenOnboarding);

  const totalSteps = ONBOARDING_STEPS.length;
  const progress = ((stepIndex + 1) / totalSteps) * 100;
  const step = ONBOARDING_STEPS[stepIndex];

  const finish = async () => {
    const snapshot = useAcademyStore.getState().completeDiagnostic();
    await saveDiagnosticResult(snapshot);
    await hasSeenOnboarding(true);
    navigation?.navigate('Auth');
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const thinkingIndices = useMemo(
    () => ONBOARDING_STEPS.map((s, i) => (s.kind === 'thinking' ? i : -1)).filter((i) => i >= 0),
    [],
  );
  const firstThinkingIndex = thinkingIndices[0] ?? -1;
  const lastThinkingIndex = thinkingIndices[thinkingIndices.length - 1] ?? -1;

  useEffect(() => {
    if (step.kind !== 'thinking' || stepIndex < firstThinkingIndex || stepIndex > lastThinkingIndex) {
      return undefined;
    }

    const timer = setTimeout(() => {
      if (stepIndex >= lastThinkingIndex) {
        if (!resultInitialized.current) {
          completeDiagnostic();
          resultInitialized.current = true;
        }
        const resultIdx = ONBOARDING_STEPS.findIndex((s) => s.kind === 'result');
        setStepIndex(resultIdx >= 0 ? resultIdx : stepIndex + 1);
      } else {
        setStepIndex((i) => i + 1);
      }
    }, LOADING_STEP_MS);

    return () => clearTimeout(timer);
  }, [step.kind, stepIndex, firstThinkingIndex, lastThinkingIndex, completeDiagnostic]);

  useEffect(() => {
    if (step.kind === 'result' && !resultInitialized.current) {
      completeDiagnostic();
      resultInitialized.current = true;
    }
  }, [step.kind, completeDiagnostic]);

  if (step.kind === 'splash') {
    return <SplashPenpotScreen onComplete={goNext} />;
  }

  if (step.kind === 'welcome') {
    const frame = PENPOT_FRAMES['02_Welcome'];
    return (
      <OnboardingStorySlide
        frame={frame}
        progress={progress}
        primaryLabel="Ver cómo funciona"
        onNext={goNext}
      />
    );
  }

  if (step.kind === 'story') {
    const frame = getPenpotFrame(step.frameId)!;
    return (
      <OnboardingStorySlide
        frame={frame}
        progress={progress}
        primaryLabel="Siguiente"
        onNext={goNext}
        onBack={goBack}
      />
    );
  }

  if (step.kind === 'question') {
    const q = diagnosticQuestions[step.index];
    return (
      <DiagnosticQuestionScreen
        question={q}
        questionIndex={step.index}
        totalQuestions={diagnosticQuestions.length}
        progress={progress}
        onBack={step.index > 0 ? goBack : undefined}
        onSubmit={(value) => {
          setAnswer(q.id, value);
          goNext();
        }}
      />
    );
  }

  if (step.kind === 'thinking') {
    const frame = onboardingThinkingFrames[step.index];
    const skip = () => {
      if (!resultInitialized.current) {
        completeDiagnostic();
        resultInitialized.current = true;
      }
      const resultIdx = ONBOARDING_STEPS.findIndex((s) => s.kind === 'result');
      setStepIndex(resultIdx >= 0 ? resultIdx : stepIndex + 1);
    };
    return <PenpotThinkingScreen frame={frame} progress={progress} onSkip={skip} />;
  }

  if (step.kind === 'result') {
    return (
      <PenpotFlowShell orbVariant="diagnostic" scroll contentStyle={styles.result}>
        <DiagnosticResultCarousel
          diagnostic={diagnostic}
          title="Tu perfil T2T está listo"
          subtitle="Deslizá para ver tu radar y tu mapa de habilidades."
        />
        <View style={styles.resultBtn}>
          <Button title="Crear mi cuenta" onPress={goNext} />
        </View>
      </PenpotFlowShell>
    );
  }

  return (
    <PenpotClosureScreen
      progress={100}
      primaryLabel="Continuar a registro"
      onNext={() => void finish()}
    />
  );
}

const styles = StyleSheet.create({
  result: {
    paddingBottom: 24,
  },
  resultBtn: {
    marginTop: 16,
    paddingHorizontal: 4,
  },
});
