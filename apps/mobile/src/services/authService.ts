import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { FS_COL } from '../constants/firestoreCollections';
import { apiFetch, hasApiBaseUrl } from './api';
import { auth, db } from './firebase';
import type { User } from '../types';

export async function login(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return getOrCreateUserProfile(credential.user);
}

export async function register(email: string, password: string, displayName: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(credential.user, { displayName });
  await sendEmailVerification(credential.user);
  return createUserProfile(credential.user.uid, {
    email,
    displayName,
    avatar: credential.user.photoURL || undefined,
  });
}

export async function loginWithGoogle(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return getOrCreateUserProfile(result.user);
}

/** Credencial Apple cuando ya tenés idToken (p. ej. desde otro SDK). */
export async function loginWithApple(identityToken: string, nonce: string): Promise<User> {
  const provider = new OAuthProvider('apple.com');
  const result = await signInWithCredential(auth, provider.credential({ idToken: identityToken, rawNonce: nonce }));
  return getOrCreateUserProfile(result.user);
}

/** Apple: nativo en iOS (expo-apple-authentication), OAuth web en web. */
export async function signInWithAppleOAuth(): Promise<User> {
  const { requestAppleSignIn } = await import('./appleSignIn');
  const user = await requestAppleSignIn();
  if (!user) {
    const err = new Error('Inicio con Apple cancelado');
    Object.assign(err, { code: 'ERR_REQUEST_CANCELED' });
    throw err;
  }
  return user;
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function resendEmailVerification(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay sesión activa');
  await sendEmailVerification(user);
}

export async function checkEmailVerified(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;
  await user.reload();
  return user.emailVerified;
}

export async function logout(): Promise<void> {
  await firebaseSignOut(auth);
  if (Platform.OS !== 'android') return;
  try {
    if (await GoogleSignin.hasPlayServices()) {
      await GoogleSignin.signOut();
    }
  } catch {
    // Google may not be configured in early builds; Firebase logout already happened.
  }
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

export async function getUserProfile(userId: string): Promise<User> {
  const snapshot = await getDoc(doc(db, FS_COL.users, userId));
  if (!snapshot.exists()) {
    throw new Error('User profile not found');
  }
  return fromFirestore(snapshot.id, snapshot.data());
}

export async function getOrCreateUserProfile(firebaseUser: FirebaseUser): Promise<User> {
  const snapshot = await getDoc(doc(db, FS_COL.users, firebaseUser.uid));
  if (snapshot.exists()) {
    return fromFirestore(snapshot.id, snapshot.data());
  }

  return createUserProfile(firebaseUser.uid, {
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || 'Alumno T2T',
    avatar: firebaseUser.photoURL || undefined,
  });
}

async function createUserProfile(uid: string, data: { email: string; displayName: string; avatar?: string }): Promise<User> {
  const profile: Omit<User, 'id'> = {
    email: data.email,
    displayName: data.displayName,
    avatar: data.avatar,
    role: 'student',
    onboardingCompleted: false,
    diagnosticCompleted: false,
    notificationTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await setDoc(doc(db, FS_COL.users, uid), {
    email: profile.email,
    displayName: profile.displayName,
    ...(profile.avatar ? { avatar: profile.avatar } : {}),
    role: profile.role,
    onboardingCompleted: profile.onboardingCompleted,
    diagnosticCompleted: profile.diagnosticCompleted,
    notificationTokens: profile.notificationTokens,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Welcome email: dispara el endpoint del CRM que envía vía Resend.
  // Idempotente del lado server (welcomeEmailSentAt en t2t_users). Fire-and-forget:
  // si el endpoint o la API base no están disponibles, no rompe el alta.
  void triggerWelcomeEmail();

  return { id: uid, ...profile };
}

async function triggerWelcomeEmail(): Promise<void> {
  if (!hasApiBaseUrl()) return;
  try {
    await apiFetch('/api/welcome-email', { method: 'POST' });
  } catch (error) {
    if (__DEV__) {
      console.warn('[authService] welcome-email no enviado', error);
    }
  }
}

function fromFirestore(id: string, data: any): User {
  const isPlanId = (v: unknown): v is User['subscriptionPlan'] =>
    v === 'free' || v === 'pro' || v === 'elite';
  const isStatus = (v: unknown): v is User['subscriptionStatus'] =>
    v === 'free' || v === 'trialing' || v === 'active' || v === 'cancelled' || v === 'expired';
  const isSource = (v: unknown): v is User['subscriptionSource'] =>
    v === 'apple' || v === 'google' || v === 'mercadopago' || v === 'code' || v === 'mock';

  return {
    id,
    email: data.email || '',
    displayName: data.displayName || 'Alumno T2T',
    phone: data.phone,
    avatar: data.avatar,
    role: data.role || 'student',
    subscriptionId: data.subscriptionId,
    onboardingCompleted: Boolean(data.onboardingCompleted),
    diagnosticCompleted: Boolean(data.diagnosticCompleted),
    hookSelections: data.hookSelections && typeof data.hookSelections === 'object' ? data.hookSelections : undefined,
    selectedPlan: data.selectedPlan,
    subscriptionPlan: isPlanId(data.subscriptionPlan) ? data.subscriptionPlan : undefined,
    subscriptionStatus: isStatus(data.subscriptionStatus) ? data.subscriptionStatus : undefined,
    subscriptionSource: isSource(data.subscriptionSource) ? data.subscriptionSource : undefined,
    trialStartedAt: data.trialStartedAt?.toDate?.() || undefined,
    trialEndsAt: data.trialEndsAt?.toDate?.() || undefined,
    subscriptionRenewsAt: data.subscriptionRenewsAt?.toDate?.() || undefined,
    subscriptionCancelledAt: data.subscriptionCancelledAt?.toDate?.() || undefined,
    appliedCouponCode: typeof data.appliedCouponCode === 'string' ? data.appliedCouponCode : undefined,
    coins: typeof data.coins === 'number' ? data.coins : undefined,
    level: typeof data.level === 'number' ? data.level : undefined,
    savedCourseIds: Array.isArray(data.savedCourseIds) ? data.savedCourseIds : undefined,
    currentStreak: typeof data.currentStreak === 'number' ? data.currentStreak : undefined,
    longestStreak: typeof data.longestStreak === 'number' ? data.longestStreak : undefined,
    lastActiveDay: typeof data.lastActiveDay === 'string' ? data.lastActiveDay : undefined,
    streakFreezesAvailable:
      typeof data.streakFreezesAvailable === 'number' ? data.streakFreezesAvailable : undefined,
    streakFreezeWeekKey:
      typeof data.streakFreezeWeekKey === 'string' ? data.streakFreezeWeekKey : undefined,
    streakMilestonesAwarded: Array.isArray(data.streakMilestonesAwarded)
      ? data.streakMilestonesAwarded.filter((n: unknown): n is number => typeof n === 'number')
      : undefined,
    notificationTokens: data.notificationTokens || [],
    createdAt: data.createdAt?.toDate?.() || new Date(),
    updatedAt: data.updatedAt?.toDate?.() || new Date(),
  };
}

export async function updateUserFields(
  uid: string,
  fields: Partial<
    Pick<
      User,
      | 'displayName'
      | 'phone'
      | 'avatar'
      | 'onboardingCompleted'
      | 'diagnosticCompleted'
      | 'subscriptionId'
      | 'hookSelections'
      | 'selectedPlan'
      | 'subscriptionPlan'
      | 'subscriptionStatus'
      | 'subscriptionSource'
      | 'trialStartedAt'
      | 'trialEndsAt'
      | 'subscriptionRenewsAt'
      | 'subscriptionCancelledAt'
      | 'appliedCouponCode'
      | 'coins'
      | 'level'
      | 'savedCourseIds'
      | 'currentStreak'
      | 'longestStreak'
      | 'lastActiveDay'
      | 'streakFreezesAvailable'
      | 'streakFreezeWeekKey'
      | 'streakMilestonesAwarded'
    >
  >,
): Promise<void> {
  await setDoc(
    doc(db, FS_COL.users, uid),
    {
      ...fields,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
