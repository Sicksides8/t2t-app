'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { FS_COL } from '../lib/firestoreCollections';
import type { UserRole } from '../types';

type AuthState = {
  firebaseUser: FirebaseUser | null;
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  refreshRole: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function fetchRole(uid: string): Promise<UserRole> {
  if (!db) return 'student';
  const snap = await getDoc(doc(db, FS_COL.users, uid));
  if (!snap.exists()) return 'student';
  const role = snap.data()?.role;
  return role === 'admin' ? 'admin' : 'student';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshRole = useCallback(async () => {
    if (!firebaseUser) {
      setRole(null);
      return;
    }
    const nextRole = await fetchRole(firebaseUser.uid);
    setRole(nextRole);
  }, [firebaseUser]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }
      try {
        const nextRole = await fetchRole(user.uid);
        setRole(nextRole);
      } catch {
        setRole('student');
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      role,
      loading,
      isAdmin: role === 'admin',
      refreshRole,
    }),
    [firebaseUser, role, loading, refreshRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
