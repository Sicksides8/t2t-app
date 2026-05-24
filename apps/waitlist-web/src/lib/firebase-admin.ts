import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

export class FirebaseAdminConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseAdminConfigError';
  }
}

function readPrivateKey(): string | undefined {
  const raw = process.env.FIREBASE_PRIVATE_KEY;
  if (!raw) return undefined;
  return raw.replace(/\\n/g, '\n');
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && readPrivateKey(),
  );
}

function initAdmin(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const privateKey = readPrivateKey();
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !clientEmail || !privateKey) {
    throw new FirebaseAdminConfigError(
      'Firebase Admin no está configurado. Agregá FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en apps/waitlist-web/.env.local (podés copiarlas desde apps/web-crm/.env.local).',
    );
  }

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

let firestore: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (!firestore) {
    firestore = getFirestore(initAdmin());
  }
  return firestore;
}
