import React from 'react';
import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
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
    <html lang="en" className={`${outfit.variable}`}>
      <head>
        <link rel="icon" href="/hitianinsidelogo.png" type="image/png" sizes="any" />
        <link rel="apple-touch-icon" href="/hitianinsidelogo.png" />
      </head>
      <body className="antialiased selection:bg-[#800020] selection:text-[#e6c594]">
        {children}
      </body>
    </html>
  );
}
