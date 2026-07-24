import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Manrope } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Jose Perez — Actividad en GitHub',
  description:
    'Perfil, repositorios y contribuciones públicas de Jose Alejandro Perez, servido por NestJS y renderizado con Next.js.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f2f3ef',
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="es" className={`${manrope.variable} ${ibmPlexMono.variable}`}>
      <body>
        <a className="skip-link" href="#perfil">
          Ir al perfil
        </a>
        {children}
      </body>
    </html>
  );
}
