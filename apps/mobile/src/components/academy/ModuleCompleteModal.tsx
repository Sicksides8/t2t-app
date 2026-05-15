import React from 'react';
import { CelebrationModal } from './CelebrationModal';

const MODULE_COINS = 50;

type Props = {
  visible: boolean;
  moduleTitle?: string;
  onContinue: () => void;
  onClose: () => void;
};

/** Penpot: 58_Modulo_Completado_Modal */
export function ModuleCompleteModal({ visible, moduleTitle, onContinue, onClose }: Props) {
  return (
    <CelebrationModal
      variant="module"
      visible={visible}
      title="¡Módulo completado!"
      body={
        moduleTitle
          ? `Terminaste «${moduleTitle}». Seguí con la siguiente lección.`
          : 'Completaste un módulo de tu curso. ¡Seguí así!'
      }
      coins={MODULE_COINS}
      primaryLabel="Siguiente lección"
      onPrimary={onContinue}
      onClose={onClose}
    />
  );
}

export { MODULE_COINS };
