import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/features/hero/Hero';
import { FeaturesGrid } from '@/features/features/FeaturesGrid';
import { CalendarMemorySynergy } from '@/features/features/CalendarMemorySynergy';
import { HowItWorks } from '@/features/how-it-works/HowItWorks';
import { PrivacySection } from '@/features/privacy/PrivacySection';
import { ProductTrust } from '@/features/trust/ProductTrust';
import { FinalCta } from '@/features/cta/FinalCta';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#070A11] text-[#F8FAFC]">
      <Navbar />
      <main className="flex-1 w-full pt-16">
        <Hero />
        <hr className="w-full border-t border-[#1E293B]" />
        <FeaturesGrid />
        <hr className="w-full border-t border-[#1E293B]" />
        <CalendarMemorySynergy />
        <hr className="w-full border-t border-[#1E293B]" />
        <HowItWorks />
        <hr className="w-full border-t border-[#1E293B]" />
        <PrivacySection />
        <hr className="w-full border-t border-[#1E293B]" />
        <ProductTrust />
        <hr className="w-full border-t border-[#1E293B]" />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
