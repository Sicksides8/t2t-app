import { diagnosticQuestions } from '../data/diagnostic';

export type DiagnosticFlowStep =
  | { kind: 'question'; index: number }
  | { kind: 'reflection'; reflectionIndex: number }
  | { kind: 'loader'; loaderIndex: number }
  | { kind: 'result' };

const ONBOARDING_INSERT_AFTER = new Map<number, DiagnosticFlowStep[]>([
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
    10,
    [
      { kind: 'reflection', reflectionIndex: 2 },
      { kind: 'loader', loaderIndex: 2 },
    ],
  ],
  [12, [{ kind: 'loader', loaderIndex: 3 }]],
]);

/** Pasos del bloque de preguntas + resultado (sin splash/carousel). */
export function buildDiagnosticFlowSteps(mode: 'onboarding' | 'retake'): DiagnosticFlowStep[] {
  const steps: DiagnosticFlowStep[] = [];
  const insertAfter = mode === 'onboarding' ? ONBOARDING_INSERT_AFTER : null;

  diagnosticQuestions.forEach((_, index) => {
    steps.push({ kind: 'question', index });
    const extras = insertAfter?.get(index);
    if (extras) {
      for (const extra of extras) steps.push(extra);
    }
  });

  steps.push({ kind: 'result' });
  return steps;
}
