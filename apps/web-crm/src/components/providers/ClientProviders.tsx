'use client';

import { AuthProvider } from '../../contexts/AuthContext';
import { AuthGuard } from '../AuthGuard';
import { ToastProvider } from '../ui/Toast';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthGuard>{children}</AuthGuard>
      </ToastProvider>
    </AuthProvider>
  );
}
