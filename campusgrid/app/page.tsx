import MainLayout from '@/components/layout/MainLayout';
import HeroSection from '@/components/landing/HeroSection';
import StatsBar from '@/components/landing/StatsBar';
import SIHInfoHub from '@/components/sih/SIHInfoHub';

export default function HomePage() {
  return (
    <MainLayout>
      <HeroSection />
      <StatsBar />
      <SIHInfoHub />
    </MainLayout>
  );
}
