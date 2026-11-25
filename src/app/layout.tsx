import React from 'react';
import { Outfit, Great_Vibes, MonteCarlo, Dancing_Script, Alex_Brush, Playfair_Display, Cormorant_Garamond } from 'next/font/google';
import './globals.css';
import AnalyticsTracker from '../components/AnalyticsTracker';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const alexBrush = Alex_Brush({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-alex-brush',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  weight: ['600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ['600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
});

const greatVibes = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-great-vibes',
  display: 'swap',
});

const monteCarlo = MonteCarlo({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-monte-carlo',
  display: 'swap',
});

const dancingScript = Dancing_Script({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-dancing-script',
  display: 'swap',
});

export const metadata = {
  title: 'HITian Inside - Event Portal & Certificate Verification',
  description: 'Official Event Portal for HITian Inside activities, workshops, and certificate verification.',
  icons: {
    icon: '/hitianinsidelogo.png',
    shortcut: '/hitianinsidelogo.png',
    apple: '/hitianinsidelogo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${alexBrush.variable} ${playfairDisplay.variable} ${cormorantGaramond.variable} ${greatVibes.variable} ${monteCarlo.variable} ${dancingScript.variable}`}>
      <head>
        <link rel="icon" href="/hitianinsidelogo.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/hitianinsidelogo.png" />
      </head>
      <body 
        className="antialiased selection:bg-[#800020] selection:text-[#e6c594]"
        suppressHydrationWarning
      >
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
