import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const tasaOrbiter = localFont({
  src: [
    { path: '../../fonts/fonts/TASAOrbiter-Regular.ttf',    weight: '400', style: 'normal' },
    { path: '../../fonts/fonts/TASAOrbiter-Medium.ttf',     weight: '500', style: 'normal' },
    { path: '../../fonts/fonts/TASAOrbiter-SemiBold.ttf',   weight: '600', style: 'normal' },
    { path: '../../fonts/fonts/TASAOrbiter-Bold.ttf',       weight: '700', style: 'normal' },
    { path: '../../fonts/fonts/TASAOrbiter-ExtraBold.ttf',  weight: '800', style: 'normal' }
  ],
  variable: '--font-display',
  display: 'swap'
});

const nunito = localFont({
  src: [
    { path: '../../fonts/fonts/Nunito-Regular.ttf',    weight: '400', style: 'normal' },
    { path: '../../fonts/fonts/Nunito-Medium.ttf',     weight: '500', style: 'normal' },
    { path: '../../fonts/fonts/Nunito-SemiBold.ttf',   weight: '600', style: 'normal' },
    { path: '../../fonts/fonts/Nunito-Bold.ttf',       weight: '700', style: 'normal' },
    { path: '../../fonts/fonts/Nunito-ExtraBold.ttf',  weight: '800', style: 'normal' }
  ],
  variable: '--font-body',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'Studio OS',
  description: 'Creator operations platform — content, sourcing, events, contacts'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${tasaOrbiter.variable} ${nunito.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
