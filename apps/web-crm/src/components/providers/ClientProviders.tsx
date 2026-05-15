'use client';

import { AuthProvider } from '../../contexts/AuthContext';
import { AuthGuard } from '../AuthGuard';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  );
}
