import React from 'react';
import { CelebrationModal } from './CelebrationModal';

const MODULE_COINS = 10;

type Props = {
  visible: boolean;
  moduleTitle?: string;
  progressPercent?: number;
  streakDelta?: number;
  onContinue: () => void;
  onBackHome?: () => void;
  onClose: () => void;
};

export function ModuleCompleteModal({
  visible,
  moduleTitle,
  progressPercent = 0,
  streakDelta = 1,
  onContinue,
  onBackHome,
  onClose,
}: Props) {
  return (
    <CelebrationModal
      variant="module"
      visible={visible}
      title={moduleTitle || 'Módulo completado'}
      body={undefined}
      coins={MODULE_COINS}
      progressPercent={progressPercent}
      streakDelta={streakDelta}
      primaryLabel="Siguiente módulo →"
      secondaryLabel={onBackHome ? 'Volver al inicio' : undefined}
      onPrimary={onContinue}
      onSecondary={onBackHome}
      onClose={onClose}
    />
  );
}

export { MODULE_COINS };
