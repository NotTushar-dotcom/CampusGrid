import Navbar from './Navbar';
import Footer from './Footer';

/**
 * MainLayout — wraps pages that need the site Navbar + Footer.
 * Import and use this directly in page components instead of relying
 * on the root layout (which is intentionally bare).
 *
 * Usage:
 *   import MainLayout from '@/components/layout/MainLayout';
 *   export default function SomePage() {
 *     return <MainLayout><YourContent /></MainLayout>;
 *   }
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
