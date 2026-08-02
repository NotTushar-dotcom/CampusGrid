import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'SIH 2026 — GL Bajaj Campus Portal | Smart India Hackathon',
  description:
    'Official GL Bajaj Group of Institutions campus portal for Smart India Hackathon 2026. Register your team, explore problem statements, and get nominated for the national grand finale.',
  keywords: ['SIH 2026', 'Smart India Hackathon', 'GL Bajaj', 'team formation', 'hackathon', 'IIC', 'campus selection'],
  openGraph: {
    title: 'SIH 2026 — GL Bajaj Campus Portal',
    description: 'Official campus portal for SIH 2026 at GL Bajaj Group of Institutions.',
    type: 'website',
  },
};

/**
 * Root layout — bare shell only.
 * Provides fonts, global CSS, ThemeProvider, and AuthProvider to ALL pages.
 *
 * Navbar + Footer are NOT here — they are rendered by MainLayout inside
 * pages that need them (e.g. app/page.tsx). Auth pages get no chrome.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('sih-theme') || localStorage.getItem('cg-dash-theme');
                  if (stored === 'light') {
                    document.documentElement.classList.add('light');
                    if (document.body) document.body.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                    if (document.body) document.body.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
