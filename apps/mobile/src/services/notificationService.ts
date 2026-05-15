import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { arrayUnion, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FS_COL } from '../constants/firestoreCollections';
import { db } from './firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function resolveExpoProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  const fromConfig = extra?.eas?.projectId?.trim();
  if (fromConfig) return fromConfig;
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  return fromEnv || undefined;
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Device.isDevice) return null;

  const projectId = resolveExpoProjectId();
  if (!projectId) return null;

  const current = await Notifications.getPermissionsAsync();
  const finalStatus = current.status === 'granted' ? current.status : (await Notifications.requestPermissionsAsync()).status;
  if (finalStatus !== 'granted') return null;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await setDoc(
    doc(db, FS_COL.users, userId),
    {
      notificationTokens: arrayUnion(token),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return token;
}
