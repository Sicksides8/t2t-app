import React, { useCallback } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DiagnosticQuestionsFlow } from '../../components/diagnostic/DiagnosticQuestionsFlow';
import { profileGoBack } from '../../navigation/profileNavigation';
import { saveDiagnosticResult } from '../../services/diagnosticService';
import { useAcademyStore } from '../../stores';
import type { ProfileStackParamList } from '../../types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'DiagnosticRetake'>;

/** Re-diagnóstico lite (14 preguntas + resultado) desde perfil. */
export function DiagnosticRetakeScreen({ navigation }: Props) {
  const beginRetake = useAcademyStore((state) => state.beginDiagnosticRetake);

  const handleStart = useCallback(() => {
    beginRetake();
  }, [beginRetake]);

  React.useEffect(() => {
    handleStart();
  }, [handleStart]);

  const handleComplete = useCallback(async () => {
    const snapshot = useAcademyStore.getState().diagnostic;
    await saveDiagnosticResult(snapshot);
    navigation.replace('DiagnosticApp');
  }, [navigation]);

  return (
    <DiagnosticQuestionsFlow
      mode="retake"
      onCancel={() => profileGoBack(navigation)}
      onResultPrimary={() => void handleComplete()}
    />
  );
}
