import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DiagnosticQuestionScreen } from './DiagnosticQuestionScreen';
import { DiagnosticRadarResultScreen } from './DiagnosticRadarResultScreen';
import { ProgressLoaderScreen, ReflectionScreen } from '../onboarding';
import { diagnosticQuestions } from '../../data/diagnostic';
import { progressLoaderFrames, reflectionFrames } from '../../data/onboardingFlow';
import { buildDiagnosticFlowSteps } from '../../utils/diagnosticFlowSteps';
import { useAcademyStore } from '../../stores';

export type DiagnosticQuestionsFlowProps = {
  mode: 'onboarding' | 'retake';
  onComplete?: () => void;
  onCancel?: () => void;
  onResultPrimary?: () => void;
  onResultSecondary?: () => void;
  onBrainMap?: () => void;
  renderResultExternally?: boolean;
  onResultReady?: () => void;
};

/**
 * Flujo reutilizable de preguntas diagnóstico (14Q) + resultado.
 * - onboarding: incluye reflexiones y loaders Penpot.
 * - retake: solo preguntas + resultado (rápido).
 */
export function DiagnosticQuestionsFlow({
  mode,
  onComplete,
  onCancel,
  onResultPrimary,
  onResultSecondary,
  onBrainMap,
  renderResultExternally = false,
  onResultReady,
}: DiagnosticQuestionsFlowProps) {
  const steps = buildDiagnosticFlowSteps(mode);
  const [stepIndex, setStepIndex] = useState(0);
  const resultInitialized = useRef(false);
  const setAnswer = useAcademyStore((state) => state.setAnswer);
  const completeDiagnostic = useAcademyStore((state) => state.completeDiagnostic);
  const diagnostic = useAcademyStore((state) => state.diagnostic);

  const step = steps[stepIndex];
  const totalSteps = steps.length;

  const goNext = useCallback(
    () => setStepIndex((i) => Math.min(i + 1, totalSteps - 1)),
    [totalSteps],
  );
  const goBack = useCallback(() => {
    if (stepIndex === 0) {
      onCancel?.();
      return;
    }
    setStepIndex((i) => Math.max(i - 1, 0));
  }, [stepIndex, onCancel]);

  const ensureDiagnosticReady = useCallback(() => {
    if (!resultInitialized.current) {
      completeDiagnostic();
      resultInitialized.current = true;
      onResultReady?.();
    }
  }, [completeDiagnostic, onResultReady]);

  useEffect(() => {
    if (step?.kind === 'result' && !resultInitialized.current) {
      completeDiagnostic();
      resultInitialized.current = true;
      onResultReady?.();
    }
  }, [step?.kind, completeDiagnostic, onResultReady]);

  if (!step) return null;

  if (step.kind === 'question') {
    const q = diagnosticQuestions[step.index];
    return (
      <DiagnosticQuestionScreen
        key={q.id}
        question={q}
        questionIndex={step.index}
        totalQuestions={diagnosticQuestions.length}
        savedValue={diagnostic.answers[q.id]}
        onBack={goBack}
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
    return (
      <ProgressLoaderScreen
        frame={frame}
        onComplete={() => {
          if (isLastLoader) ensureDiagnosticReady();
          goNext();
        }}
      />
    );
  }

  if (step.kind === 'result') {
    if (renderResultExternally) return null;
    const fresh = useAcademyStore.getState().diagnostic;
    return (
      <DiagnosticRadarResultScreen
        diagnostic={fresh}
        onBack={onCancel}
        onPrimary={() => {
          if (onResultPrimary) onResultPrimary();
          else onComplete?.();
        }}
        onSecondary={() => onResultSecondary?.()}
        onBrainMap={onBrainMap}
      />
    );
  }

  return null;
}
