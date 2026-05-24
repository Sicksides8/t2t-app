import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'T2T Academy — Lista de espera',
  description: 'Sumate a la beta cerrada de T2T Academy y entrená las habilidades que transforman tu carrera.',
  openGraph: {
    title: 'T2T Academy — Lista de espera',
    description: 'Acceso anticipado a la academia personal de habilidades humanas.',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
