import { Outfit } from 'next/font/google';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata = {
  title: 'HITian Inside - Event Portal',
  description: 'Official Event Portal for HITian Inside activities, workshops, and hackathons.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable}`}>
      <body className="antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
