import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-zinc-100 selection:bg-orange-500 selection:text-white">
      <Navbar />
      <HeroSection />
      <BentoGrid />
      <HowItWorks />
      <CtaSection />
      <Footer />
    </main>
  );
}