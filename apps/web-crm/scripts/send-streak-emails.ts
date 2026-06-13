/**
 * Job diario que envía email "tu racha está en peligro" a usuarios con
 * currentStreak >= 1 que aún no entraron hoy (UTC).
 *
 * Disparado por GitHub Actions schedule (`.github/workflows/streak-emails.yml`).
 * También invocable a mano vía `npx tsx apps/web-crm/scripts/send-streak-emails.ts`
 * teniendo las envs FIREBASE_*, RESEND_API_KEY, WAITLIST_FROM_EMAIL,
 * WAITLIST_FROM_NAME en el ambiente.
 *
 * Idempotencia: marca `lastStreakWarningEmailSentAt` por usuario; si el job
 * vuelve a correr el mismo día UTC, esos usuarios se saltan.
 */

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '../src/lib/firebase-admin';
import { sendStreakWarningEmail } from '../src/lib/email/sendStreakWarningEmail';
import { FS_COL } from '../src/lib/firestoreCollections';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function dayKeyUTC(d: Date = new Date()): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

async function main(): Promise<void> {
  const today = dayKeyUTC();
  const startOfTodayUTC = new Date(`${today}T00:00:00.000Z`);

  let total = 0;
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  const snap = await adminDb.collection(FS_COL.users).where('currentStreak', '>=', 1).get();
  total = snap.size;

  for (const doc of snap.docs) {
    const data = doc.data() || {};
    const email = typeof data.email === 'string' ? data.email.trim() : '';
    if (!email) {
      skipped++;
      continue;
    }
    if (data.lastActiveDay === today) {
      skipped++;
      continue;
    }

    const last = data.lastStreakWarningEmailSentAt?.toDate?.();
    if (last instanceof Date && last >= startOfTodayUTC) {
      skipped++;
      continue;
    }

    const displayName =
      typeof data.displayName === 'string' && data.displayName.trim().length > 0
        ? data.displayName.trim()
        : 'Alumno T2T';
    const currentStreak = typeof data.currentStreak === 'number' ? data.currentStreak : 1;

    const result = await sendStreakWarningEmail({ to: email, displayName, currentStreak });
    if (!result.ok) {
      failed++;
      console.warn('[streak-emails] failed', doc.id, result.error);
      continue;
    }

    await doc.ref.set({ lastStreakWarningEmailSentAt: FieldValue.serverTimestamp() }, { merge: true });
    sent++;
  }

  console.log('[streak-emails]', { today, total, sent, skipped, failed });
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[streak-emails] fatal', err);
    process.exit(1);
  });
