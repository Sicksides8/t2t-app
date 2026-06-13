import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import * as authService from '../services/authService';
import { isGoogleSignInConfigured, requestGoogleIdToken } from '../services/googleSignIn';
import { cancelStreakReminder } from '../services/streakReminder';
import { getBillingProvider } from '../services/subscriptionService';
import { mapAuthError } from '../utils/mapAuthError';
import type { User } from '../types';

export type PendingAuthRoute = 'Login' | 'SignUp' | null;

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  hasSeenOnboarding: boolean;
  /**
   * Pista para AuthStack sobre dónde montar el primer screen al hacer el swap
   * desde onboarding (ej: "Ya tengo cuenta" → 'Login'). Se limpia al consumirse.
   */
  pendingAuthRoute: PendingAuthRoute;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  signInWithGoogleNative: () => Promise<void>;
  /** Apple nativo en iOS; no disponible en Android. */
  signInWithAppleNative: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setInitialized: () => void;
  setHasSeenOnboarding: (value: boolean) => Promise<void>;
  setPendingAuthRoute: (route: PendingAuthRoute) => void;
  setOnboardingCompleted: (value: boolean) => Promise<void>;
  setDiagnosticCompleted: (value: boolean) => void;
  refreshUserProfile: () => Promise<void>;
  /**
   * Watcher de expiración de suscripciones / trials.
   * Idempotente — se puede llamar desde App.tsx al volver del background
   * o desde refreshUserProfile sin riesgo de doble cobro.
   *
   * TODO MERCADOPAGO: en producción esta decisión la toma el webhook del
   * backend. Este watcher cliente sólo refleja el estado correcto en la UI.
   */
  checkSubscriptionExpiry: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  hasSeenOnboarding: false,
  pendingAuthRoute: null,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.login(email, password);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const message = mapAuthError(error);
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  register: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.register(email, password, displayName);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const message = mapAuthError(error);
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.loginWithGoogle(idToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const message = mapAuthError(error);
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  signInWithGoogleNative: async () => {
    set({ isLoading: true, error: null });
    try {
      if (!isGoogleSignInConfigured()) {
        set({
          error: 'Google Sign-In no esta configurado. Agrega EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en .env',
          isLoading: false,
        });
        return;
      }
      const idToken = await requestGoogleIdToken();
      if (!idToken) {
        set({ isLoading: false });
        return;
      }
      const user = await authService.loginWithGoogle(idToken);
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      if (__DEV__) {
        console.warn('[Auth] Google sign-in failed', error);
      }
      const message = mapAuthError(error);
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  signInWithAppleNative: async () => {
    set({ isLoading: true, error: null });
    try {
      const user = await authService.signInWithAppleOAuth();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? String((error as { code: unknown }).code)
          : '';
      if (code === 'ERR_REQUEST_CANCELED') {
        set({ isLoading: false });
        return;
      }
      const message = mapAuthError(error);
      set({ error: message, isLoading: false });
      throw new Error(message);
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await cancelStreakReminder().catch(() => undefined);
    await authService.logout();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  setInitialized: () => set({ isInitialized: true }),

  setHasSeenOnboarding: async (value) => {
    await AsyncStorage.setItem('hasSeenOnboarding', JSON.stringify(value));
    set({ hasSeenOnboarding: value });
  },

  setPendingAuthRoute: (route) => set({ pendingAuthRoute: route }),

  setOnboardingCompleted: async (value) => {
    const current = get().user;
    if (current) {
      await authService.updateUserFields(current.id, { onboardingCompleted: value });
      set({ user: { ...current, onboardingCompleted: value } });
    }
  },

  setDiagnosticCompleted: (value) => {
    const current = get().user;
    if (current) set({ user: { ...current, diagnosticCompleted: value } });
  },

  refreshUserProfile: async () => {
    const current = get().user;
    if (!current) return;
    const profile = await authService.getUserProfile(current.id);
    set({ user: profile, isAuthenticated: true });
    try {
      await get().checkSubscriptionExpiry();
    } catch {
      // El watcher no debe bloquear la actualización del perfil.
    }
  },

  checkSubscriptionExpiry: async () => {
    const current = get().user;
    if (!current) return;
    const status = current.subscriptionStatus;
    const renewsAt = current.subscriptionRenewsAt?.getTime();
    if (!status || !renewsAt) return;
    const now = Date.now();
    const provider = getBillingProvider();

    // Trial vencido y sin cancelar -> auto-renueva (consistente con IAP/MP).
    // TODO MERCADOPAGO: en producción este auto-renew lo dispara el webhook
    // de la pasarela. El watcher cliente sólo refleja el resultado.
    if (status === 'trialing' && renewsAt < now) {
      try {
        await provider.subscribe(
          current.id,
          current.subscriptionPlan ?? 'pro',
          'monthly',
          current.subscriptionSource ?? 'mock',
        );
        const profile = await authService.getUserProfile(current.id);
        set({ user: profile });
      } catch {
        /* ignoramos errores transitorios */
      }
      return;
    }

    // Suscripción cancelada cuyo período pagado ya venció -> marcar expired.
    if (status === 'cancelled' && renewsAt < now) {
      try {
        await authService.updateUserFields(current.id, { subscriptionStatus: 'expired' });
        set({ user: { ...current, subscriptionStatus: 'expired' } });
      } catch {
        /* ignoramos errores transitorios */
      }
    }
  },

  clearError: () => set({ error: null }),
}));
