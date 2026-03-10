import { Header } from "@/components/header";
import { Hero } from "@/components/landing/Hero";
import { ProblemAgitation } from "@/components/landing/ProblemAgitation";
import { Vision } from "@/components/landing/Vision";
// import { Steps } from "@/components/landing/Steps";
import { Features } from "@/components/landing/Features";
import { PublishingAdvantages } from "@/components/landing/PublishingAdvantages";
// import { Pricing } from "@/components/landing/Pricing";
import { Faq } from "@/components/landing/Faq";
import { CTA } from "@/components/landing/Cta";
import { Ctanew } from "@/components/landing/Cta2";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <div className="bg-white">
      <Header />
      <Hero />
      <ProblemAgitation />
      <Vision />
      <Features />
      {/* <Steps /> */}
      <PublishingAdvantages />
      <Ctanew />
      <Faq />
      {/* <CTA /> */}

      <Footer />
    </div>
  );
}
