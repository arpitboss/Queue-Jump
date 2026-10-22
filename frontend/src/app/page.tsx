import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { BentoGrid } from "@/components/landing/BentoGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-[#0A0A0A] selection:bg-[#3074FE]/12 selection:text-[#3074FE]">
      <Navbar />
      <HeroSection />
      <BentoGrid />
      <HowItWorks />
      <CtaSection />
      <Footer />
    </main>
  );
}
