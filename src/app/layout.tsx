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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable}`}>
      <body className="antialiased selection:bg-[#800020] selection:text-[#e6c594]">
        {children}
      </body>
    </html>
  );
}
