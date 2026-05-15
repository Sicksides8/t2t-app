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
import { FS_COL } from '../constants/firestoreCollections';
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

/** Apple Sign-In solo con Firebase Auth (OAuth popup/redirect). */
export async function signInWithAppleOAuth(): Promise<User> {
  const { signInWithAppleFirebase } = await import('./appleSignIn');
  const credential = await signInWithAppleFirebase();
  return getOrCreateUserProfile(credential.user);
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

async function getOrCreateUserProfile(firebaseUser: FirebaseUser): Promise<User> {
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

  return { id: uid, ...profile };
}

function fromFirestore(id: string, data: any): User {
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
    coins: typeof data.coins === 'number' ? data.coins : undefined,
    level: typeof data.level === 'number' ? data.level : undefined,
    savedCourseIds: Array.isArray(data.savedCourseIds) ? data.savedCourseIds : undefined,
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
      | 'coins'
      | 'level'
      | 'savedCourseIds'
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
