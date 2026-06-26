import { Alert } from 'react-native';
import { generateAndShareCertificatePdf } from './certificatePdf';

export async function exportCertificatePdf(params: {
  userName: string;
  courseTitle: string;
  earnedAt?: Date;
  certificateId?: string;
}): Promise<void> {
  try {
    await generateAndShareCertificatePdf(params);
  } catch (err) {
    Alert.alert(
      'No se pudo generar el certificado',
      err instanceof Error ? err.message : 'Intentá de nuevo en unos segundos.',
    );
  }
}
