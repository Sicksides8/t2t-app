import type { Metadata } from 'next';
import { ClientProviders } from '../components/providers/ClientProviders';
import './globals.css';

export const metadata: Metadata = {
  title: 'T2T Academy CRM',
  description: 'Panel administrativo de T2T Academy',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
