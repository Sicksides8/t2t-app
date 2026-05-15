import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FS_COL } from '../constants/firestoreCollections';
import { auth, db } from './firebase';
import type { DiagnosticResult } from '../types';

const PENDING_KEY = 't2t_pending_diagnostic';

export async function stashPendingDiagnostic(diagnostic: DiagnosticResult): Promise<void> {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(diagnostic));
}

export async function readPendingDiagnostic(): Promise<DiagnosticResult | null> {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DiagnosticResult;
    if (parsed?.answers) {
      return {
        ...parsed,
        completedAt: parsed.completedAt ? new Date(parsed.completedAt as unknown as string) : new Date(),
      };
    }
  } catch {
    // ignore
  }
  return null;
}

async function clearPendingDiagnostic(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_KEY);
}

export async function saveDiagnosticResult(diagnostic: DiagnosticResult): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    await stashPendingDiagnostic(diagnostic);
    return;
  }

  await setDoc(
    doc(db, FS_COL.diagnosticResults, user.uid),
    {
      ...diagnostic,
      userId: user.uid,
      completedAt: serverTimestamp(),
    },
    { merge: true },
  );

  await setDoc(
    doc(db, FS_COL.users, user.uid),
    {
      diagnosticCompleted: true,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function flushPendingDiagnosticIfAuthenticated(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;
  const pending = await readPendingDiagnostic();
  if (!pending) return;
  await setDoc(
    doc(db, FS_COL.diagnosticResults, user.uid),
    {
      ...pending,
      userId: user.uid,
      completedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await setDoc(
    doc(db, FS_COL.users, user.uid),
    { diagnosticCompleted: true, updatedAt: serverTimestamp() },
    { merge: true },
  );
  await clearPendingDiagnostic();
}
