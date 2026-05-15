import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

function initAdmin(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const hasServiceAccount =
    Boolean(process.env.FIREBASE_PROJECT_ID) && Boolean(process.env.FIREBASE_CLIENT_EMAIL) && Boolean(privateKey);

  if (hasServiceAccount) {
    return initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey!,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 't2t-local',
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const adminApp = initAdmin();

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminStorage = getStorage(adminApp);
