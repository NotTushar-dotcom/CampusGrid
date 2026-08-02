import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CampusGrid — Sign In | GL Bajaj SIH 2026 Portal',
  description: 'Sign in or register for the GL Bajaj CampusGrid portal — Smart India Hackathon 2026.',
};

/**
 * Auth layout — intentionally bare passthrough.
 * No Navbar, no Footer, no extra providers.
 *
 * ThemeProvider + AuthProvider are inherited from the root layout,
 * so useTheme() inside login/register pages reflects the theme the user
 * chose on the main site (stored in localStorage under 'sih-theme').
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
