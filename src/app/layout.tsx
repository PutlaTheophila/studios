import type { Metadata } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { QueryProvider } from '@/components/QueryProvider';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap'
});

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Studio OS',
  description: 'Creator operations platform — content, sourcing, events, contacts'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body><QueryProvider>{children}</QueryProvider></body>
    </html>
  );
}
