import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Surfaces } from "@/components/landing/Surfaces";
import { Features } from "@/components/landing/Features";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Surfaces />
        <Features />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
