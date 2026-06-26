import React from 'react';
import { CelebrationModal } from './CelebrationModal';
import { LESSON_COINS } from '../../services/gamificationService';

type Props = {
  visible: boolean;
  moduleTitle?: string;
  nextLessonTitle?: string;
  hasNextLesson?: boolean;
  progressPercent?: number;
  streakDelta?: number;
  coins?: number;
  onContinue: () => void;
  onBackHome?: () => void;
  onClose: () => void;
};

export function ModuleCompleteModal({
  visible,
  moduleTitle,
  nextLessonTitle,
  hasNextLesson = false,
  progressPercent = 0,
  streakDelta = 0,
  coins = LESSON_COINS,
  onContinue,
  onBackHome,
  onClose,
}: Props) {
  const primaryLabel = hasNextLesson ? 'Siguiente módulo' : 'Volver al curso';

  return (
    <CelebrationModal
      variant="module"
      visible={visible}
      title={moduleTitle || 'Módulo completado'}
      body={
        hasNextLesson
          ? 'Seguí con el próximo módulo cuando quieras.'
          : 'Completaste todos los módulos de este curso.'
      }
      coins={coins}
      progressPercent={progressPercent}
      streakDelta={streakDelta}
      primaryLabel={primaryLabel}
      showNextModuleButton={hasNextLesson}
      nextModuleTitle={nextLessonTitle}
      secondaryLabel={hasNextLesson && onBackHome ? 'Volver al curso' : undefined}
      onPrimary={onContinue}
      onSecondary={onBackHome}
      onClose={onClose}
    />
  );
}

export { LESSON_COINS as MODULE_COINS };
