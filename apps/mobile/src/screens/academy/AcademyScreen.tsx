import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  DiagnosticBrainMapScreen,
  DiagnosticQuestionScreen,
  DiagnosticRadarResultScreen,
  EmailDeliveryScreen,
} from '../../components/diagnostic';
import {
  ComoFuncionaScreen,
  DiagnosticActionScreen,
  DiagnosticOpenerScreen,
  OnboardingCarouselSlide,
  OnboardingCierreScreen,
  ProgressLoaderScreen,
  ReflectionScreen,
  SplashPenpotScreen,
  WelcomeIntroScreen,
} from '../../components/onboarding';
import { diagnosticQuestions } from '../../data/diagnostic';
import {
  ACTION_FRAME,
  carouselSlides,
  progressLoaderFrames,
  reflectionFrames,
} from '../../data/onboardingFlow';
import { sendDiagnosticResultEmail } from '../../services/diagnosticEmailService';
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

const TOTAL_CAROUSEL_DOTS = carouselSlides.length + 1; // 5 story + 1 action = 6

type OnboardingStep =
  | { kind: 'splash' }
  | { kind: 'welcome' }
  | { kind: 'comoFunciona' }
  | { kind: 'carouselSlide'; slideIndex: number } // 04-08
  | { kind: 'action' } // 09
  | { kind: 'opener' } // 10
  | { kind: 'question'; index: number } // 11-14, 17-20, 23-26, 29-30
  | { kind: 'reflection'; reflectionIndex: number } // 15, 21, 27
  | { kind: 'loader'; loaderIndex: number } // 16, 22, 28, 31
  | { kind: 'result' } // 32
  | { kind: 'closure' };

/**
 * Construye la secuencia exacta del flujo:
 * splash → welcome → comoFunciona →
 * 5 carouselSlide (04-08) → action (09) → opener (10) →
 * Q1..Q4 → reflection 0 (15) → loader 0 (16) →
 * Q5..Q8 → reflection 1 (21) → loader 1 (22) →
 * Q9..Q12 → reflection 2 (27) → loader 2 (28) →
 * Q13 → Q14 → loader 3 (31) → result (32) → closure
 *
 * Cada loader funciona como punto de "cálculo" tras la sección
 * correspondiente del diagnóstico (33% → 67% → 83% → 100%).
 */
function buildOnboardingSteps(): OnboardingStep[] {
  const steps: OnboardingStep[] = [
    { kind: 'splash' },
    { kind: 'welcome' },
    { kind: 'comoFunciona' },
  ];
  carouselSlides.forEach((_, slideIndex) => {
    steps.push({ kind: 'carouselSlide', slideIndex });
  });
  steps.push({ kind: 'action' });
  steps.push({ kind: 'opener' });

  const insertAfter = new Map<number, OnboardingStep[]>([
    [
      3,
      [
        { kind: 'reflection', reflectionIndex: 0 },
        { kind: 'loader', loaderIndex: 0 },
      ],
    ],
    [
      7,
      [
        { kind: 'reflection', reflectionIndex: 1 },
        { kind: 'loader', loaderIndex: 1 },
      ],
    ],
    [
      11,
      [
        { kind: 'reflection', reflectionIndex: 2 },
        { kind: 'loader', loaderIndex: 2 },
      ],
    ],
    [13, [{ kind: 'loader', loaderIndex: 3 }]],
  ]);

  diagnosticQuestions.forEach((_, index) => {
    steps.push({ kind: 'question', index });
    const extras = insertAfter.get(index);
    if (extras) {
      for (const extra of extras) steps.push(extra);
    }
  });

  steps.push({ kind: 'result' });
  steps.push({ kind: 'closure' });
  return steps;
}

const ONBOARDING_STEPS = buildOnboardingSteps();
const RESULT_INDEX = ONBOARDING_STEPS.findIndex((s) => s.kind === 'result');

/** Penpot: 01_Splash */
export function SplashScreen({ navigation }: Partial<NativeStackScreenProps<RootStackParamList, 'Bootstrap'>>) {
  return <SplashPenpotScreen onComplete={() => navigation?.navigate('Onboarding')} />;
}

type ResultView = 'radar' | 'brainMap' | 'email';

/** Flujo onboarding + diagnóstico Penpot 01–35 */
export function OnboardingFlow({ navigation }: Partial<NativeStackScreenProps<RootStackParamList, 'Onboarding'>>) {
  const [stepIndex, setStepIndex] = useState(0);
  const [resultView, setResultView] = useState<ResultView>('radar');
  const resultInitialized = useRef(false);
  const setAnswer = useAcademyStore((state) => state.setAnswer);
  const completeDiagnostic = useAcademyStore((state) => state.completeDiagnostic);
  const diagnostic = useAcademyStore((state) => state.diagnostic);
  const setHasSeenOnboarding = useAuthStore((state) => state.setHasSeenOnboarding);
  const setPendingAuthRoute = useAuthStore((state) => state.setPendingAuthRoute);

  const totalSteps = ONBOARDING_STEPS.length;
  const step = ONBOARDING_STEPS[stepIndex];

  const goNext = useCallback(
    () => setStepIndex((i) => Math.min(i + 1, totalSteps - 1)),
    [totalSteps],
  );
  const goBack = useCallback(
    () => setStepIndex((i) => Math.max(i - 1, 0)),
    [],
  );

  const ensureDiagnosticReady = useCallback(() => {
    if (!resultInitialized.current) {
      completeDiagnostic();
      resultInitialized.current = true;
    }
  }, [completeDiagnostic]);

  const skipToResult = useCallback(() => {
    ensureDiagnosticReady();
    setStepIndex(RESULT_INDEX >= 0 ? RESULT_INDEX : (i) => i);
  }, [ensureDiagnosticReady]);

  const finish = useCallback(async () => {
    const snapshot = useAcademyStore.getState().completeDiagnostic();
    await saveDiagnosticResult(snapshot);
    await setHasSeenOnboarding(true);
    navigation?.navigate('Auth');
  }, [navigation, setHasSeenOnboarding]);

  const skipToLogin = useCallback(async () => {
    setPendingAuthRoute('Login');
    await setHasSeenOnboarding(true);
  }, [setHasSeenOnboarding, setPendingAuthRoute]);

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
    return (
      <WelcomeIntroScreen
        onNext={goNext}
        onSkipToLogin={() => void skipToLogin()}
      />
    );
  }

  if (step.kind === 'comoFunciona') {
    return (
      <ComoFuncionaScreen
        onNext={goNext}
        onSkipToLogin={() => void skipToLogin()}
      />
    );
  }

  if (step.kind === 'carouselSlide') {
    const slide = carouselSlides[step.slideIndex];
    return (
      <OnboardingCarouselSlide
        slide={slide}
        dotIndex={step.slideIndex}
        totalDots={TOTAL_CAROUSEL_DOTS}
        onNext={goNext}
      />
    );
  }

  if (step.kind === 'action') {
    return (
      <DiagnosticActionScreen
        totalDots={TOTAL_CAROUSEL_DOTS}
        onNext={goNext}
        onSkip={skipToResult}
      />
    );
  }

  if (step.kind === 'opener') {
    return <DiagnosticOpenerScreen onNext={goNext} />;
  }

  if (step.kind === 'question') {
    const q = diagnosticQuestions[step.index];
    return (
      <DiagnosticQuestionScreen
        question={q}
        questionIndex={step.index}
        totalQuestions={diagnosticQuestions.length}
        onBack={step.index > 0 ? goBack : undefined}
        onSubmit={(value) => {
          setAnswer(q.id, value);
          goNext();
        }}
      />
    );
  }

  if (step.kind === 'reflection') {
    const frame = reflectionFrames[step.reflectionIndex];
    return <ReflectionScreen frame={frame} onNext={goNext} />;
  }

  if (step.kind === 'loader') {
    const frame = progressLoaderFrames[step.loaderIndex];
    const isLastLoader = step.loaderIndex === progressLoaderFrames.length - 1;
    const onComplete = () => {
      if (isLastLoader) {
        ensureDiagnosticReady();
      }
      goNext();
    };
    return <ProgressLoaderScreen frame={frame} onComplete={onComplete} />;
  }

  if (step.kind === 'result') {
    if (resultView === 'email') {
      return (
        <EmailDeliveryScreen
          onBack={() => setResultView('radar')}
          onSubmit={async (email) => {
            try {
              await sendDiagnosticResultEmail({ email, diagnostic });
              Alert.alert('Listo', 'Te enviamos tu diagnóstico al email.');
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'No pudimos enviar el email.';
              Alert.alert('No pudimos enviarlo', msg);
            }
          }}
        />
      );
    }
    if (resultView === 'brainMap') {
      return (
        <DiagnosticBrainMapScreen
          diagnostic={diagnostic}
          onBack={() => setResultView('radar')}
          onPrimary={() => {
            setResultView('radar');
            goNext();
          }}
          onSecondary={() => setResultView('radar')}
        />
      );
    }
    return (
      <DiagnosticRadarResultScreen
        diagnostic={diagnostic}
        onPrimary={goNext}
        onSecondary={() => setResultView('email')}
        onBrainMap={() => setResultView('brainMap')}
      />
    );
  }

  return (
    <OnboardingCierreScreen
      onStart={() => void finish()}
      onExplore={() => void finish()}
    />
  );
}
