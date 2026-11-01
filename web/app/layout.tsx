import type { Metadata, Viewport } from 'next';
import { Overpass, Overpass_Mono } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import './globals.css';

// Variable fonts: one file each covers every weight the design uses.
const overpass = Overpass({ variable: '--font-overpass', subsets: ['latin'] });
const overpassMono = Overpass_Mono({ variable: '--font-overpass-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'RePark — ask a driver to move their car, privately',
    template: '%s · RePark',
  },
  description:
    'Blocked in? RePark alerts the vehicle owner anonymously so they can come and move it. ' +
    'No phone numbers or names are ever shared.',
};

export const viewport: Viewport = {
  // Browser bar colour: the brand field colour (--color-field) in each theme.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0B46C9' },
    { media: '(prefers-color-scheme: dark)', color: '#1A2440' },
  ],
  viewportFit: 'cover', // lets the phone tab bar sit above the home indicator
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${overpass.variable} ${overpassMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
