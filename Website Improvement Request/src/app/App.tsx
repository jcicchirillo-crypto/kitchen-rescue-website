import { Header } from '@/app/components/Header';
import { Hero } from '@/app/components/Hero';
import { ProblemSection } from '@/app/components/ProblemSection';
import { SolutionSection } from '@/app/components/SolutionSection';
import { ProcessSection } from '@/app/components/ProcessSection';
import { BenefitsSection } from '@/app/components/BenefitsSection';
import { SpecSection } from '@/app/components/SpecSection';
import { FAQSection } from '@/app/components/FAQSection';
import { ContactSection } from '@/app/components/ContactSection';
import { Footer } from '@/app/components/Footer';
import { WhatsAppButton } from '@/app/components/WhatsAppButton';

export default function App() {
  return (
    <div className="min-h-screen bg-neutral-950">
      <Header />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <ProcessSection />
        <BenefitsSection />
        <SpecSection />
        <FAQSection />
        <ContactSection />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}