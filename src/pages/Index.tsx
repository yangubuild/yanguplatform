import { MarketingShell } from "@/components/primitives";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Surfaces } from "@/components/landing/Surfaces";
import { Features } from "@/components/landing/Features";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <MarketingShell header={<Header />} footer={<Footer />}>
      <Hero />
      <Surfaces />
      <Features />
      <CTA />
    </MarketingShell>
  );
};

export default Index;
