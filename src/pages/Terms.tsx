import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 container max-w-3xl py-16 px-4">
        <h1 className="text-3xl font-bold mb-8">Terms of Service — Yangu</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Platform Usage</h2>
          <p className="text-muted-foreground leading-relaxed">
            Yangu provides creator, agency, and community tools designed to help you build and manage your digital presence.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. Accounts</h2>
          <p className="text-muted-foreground leading-relaxed">
            Users must provide accurate information when creating an account and are responsible for maintaining the security of their account credentials.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. Content Responsibility</h2>
          <p className="text-muted-foreground leading-relaxed">
            Users are responsible for all content they publish on the platform. You retain ownership of your content but grant Yangu a license to display it within the platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Availability</h2>
          <p className="text-muted-foreground leading-relaxed">
            Features and services may evolve as the platform grows. We strive to maintain availability but do not guarantee uninterrupted access.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            For questions about these terms, contact us at{" "}
            <a href="mailto:admin@yangu.io" className="text-primary underline hover:text-primary/80">
              admin@yangu.io
            </a>.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
