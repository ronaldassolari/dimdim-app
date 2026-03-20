import type { Metadata } from "next";
import "./globals.css";
import CookieBanner from '@/components/CookieBanner';

export const metadata: Metadata = {
  title: 'Dimdim — Assistente Financeiro Pessoal',
  description: 'Controle suas finanças, cartões, pontos e metas. Busque preços, registre gastos e receba insights personalizados.',
  openGraph: {
    title: 'Dimdim — Assistente Financeiro Pessoal',
    description: 'Controle suas finanças, cartões, pontos e metas.',
    url: 'https://dimdim-snowy.vercel.app',
    siteName: 'Dimdim',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Dimdim — Assistente Financeiro Pessoal',
    description: 'Controle suas finanças pessoais de forma inteligente.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
