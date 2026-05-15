import { useEffect } from 'react';
import { registerForPushNotifications } from '../services/notificationService';
import { useAuthStore } from '../stores';

export default function PushNotificationManager() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user?.id) return;
    registerForPushNotifications(user.id).catch((error) => {
      console.warn('[PushNotificationManager] No se pudo registrar push token', error);
    });
  }, [user?.id]);

  return null;
}
