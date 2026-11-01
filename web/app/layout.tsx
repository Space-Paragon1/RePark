import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

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
  themeColor: '#2563eb',
  viewportFit: 'cover', // lets the phone tab bar sit above the home indicator
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
