/**
 * Recordatorio local diario anti-churn ("tu racha se acaba en X horas").
 *
 * - Se programa con `expo-notifications` (canal `streak` en Android).
 * - Se dispara cada día a `REMINDER_HOUR_LOCAL` (20:00 por defecto) y solo
 *   si el usuario no estuvo activo ese día. Como no podemos condicionar el
 *   contenido al momento de disparo, reprogramamos cada vez que hay
 *   actividad (Push se cancela y vuelve a setearse 24h después).
 * - Es idempotente: persiste el id del schedule en AsyncStorage y lo
 *   cancela antes de pedir uno nuevo.
 * - No falla nunca: si el dispositivo es simulador o el permiso fue
 *   denegado, simplemente no programa nada.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getStreakStatus } from './streakService';

const STORAGE_KEY = 'streak.reminderId';
const ANDROID_CHANNEL_ID = 'streak';
const REMINDER_HOUR_LOCAL = 20; // 20:00 hora local
const REMINDER_MINUTE_LOCAL = 0;

let androidChannelReady = false;

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || androidChannelReady) return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Recordatorios de racha',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF7A1A',
    });
    androidChannelReady = true;
  } catch {
    /* algunos OEMs bloquean; seguimos sin canal */
  }
}

async function hasPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return true;
    // No pedimos permiso acá; eso lo hace el flujo de push remoto
    // (`registerForPushNotifications`). Si no fue concedido, simplemente
    // no programamos nada hasta que el usuario lo habilite.
    return false;
  } catch {
    return false;
  }
}

async function cancelExisting(): Promise<void> {
  try {
    const prev = await AsyncStorage.getItem(STORAGE_KEY);
    if (prev) {
      await Notifications.cancelScheduledNotificationAsync(prev);
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    /* noop */
  }
}

/** Próximo `REMINDER_HOUR_LOCAL:REMINDER_MINUTE_LOCAL` en el futuro. */
function nextReminderDate(now: Date = new Date()): Date {
  const target = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    REMINDER_HOUR_LOCAL,
    REMINDER_MINUTE_LOCAL,
    0,
    0,
  );
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

/**
 * Reprograma el recordatorio diario. Llamar después de cada `recordActivity()`.
 *
 * - Si no hay racha (currentStreak <= 0), no programa nada (no hay nada que perder).
 * - Si el usuario ya estuvo activo hoy y queda menos de 1h al cambio de día,
 *   programa directamente para mañana.
 */
export async function scheduleStreakReminder(): Promise<void> {
  if (!Device.isDevice) return;

  const status = getStreakStatus();
  await cancelExisting();

  if (status.currentStreak <= 0) return;

  if (!(await hasPermission())) return;
  await ensureAndroidChannel();

  try {
    const triggerDate = nextReminderDate();
    const title = '¡Cuidá tu racha!';
    const body = status.activeToday
      ? `Llevás ${status.currentStreak} días seguidos. Volvé mañana para mantenerla.`
      : `Tu racha de ${status.currentStreak} día${status.currentStreak === 1 ? '' : 's'} se acaba pronto. Hacé tu módulo de hoy.`;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: { type: 'streak_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
    });
    await AsyncStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* permisos revocados a mitad de camino, OEM raro, etc. */
  }
}

/** Cancela el recordatorio (usar al hacer logout). */
export async function cancelStreakReminder(): Promise<void> {
  await cancelExisting();
}
