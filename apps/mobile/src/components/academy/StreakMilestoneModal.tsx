import React from 'react';
import { CelebrationModal } from './CelebrationModal';

type Props = {
  visible: boolean;
  days: number;
  bonus: number;
  onClose: () => void;
};

function copyForDays(days: number): { title: string; body: string } {
  if (days >= 100) {
    return {
      title: `¡${days} días seguidos!`,
      body: 'Sos imparable. Esto ya es parte de quien sos.',
    };
  }
  if (days >= 30) {
    return {
      title: `¡${days} días seguidos!`,
      body: 'Un mes entrenando. El hábito ya está instalado.',
    };
  }
  if (days >= 14) {
    return {
      title: `¡${days} días seguidos!`,
      body: 'Dos semanas de constancia. Esto ya es serio.',
    };
  }
  if (days >= 7) {
    return {
      title: `¡${days} días seguidos!`,
      body: 'Una semana completa. Tu cerebro lo agradece.',
    };
  }
  return {
    title: `¡${days} días seguidos!`,
    body: 'Arrancaste con todo. Mantenela viva.',
  };
}

/**
 * Modal de celebración cuando se alcanza un hito de racha (3, 7, 14, 30, 60, 100).
 * Reutiliza `CelebrationModal` con el variant "course" para mostrar el ícono de llama.
 */
export function StreakMilestoneModal({ visible, days, bonus, onClose }: Props) {
  const { title, body } = copyForDays(days);

  return (
    <CelebrationModal
      visible={visible}
      variant="course"
      icon="flame"
      title={title}
      body={body}
      coins={bonus}
      primaryLabel="¡Sigamos!"
      onPrimary={onClose}
      onClose={onClose}
    />
  );
}
