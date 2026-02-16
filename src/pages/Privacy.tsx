import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 container max-w-3xl py-16 px-4">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy — Yangu</h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect account information you provide (name, email, username), data received through Google OAuth login, platform activity related to your use of Yangu, and basic technical data such as browser type and IP address.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">2. How We Use Information</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your information is used for authentication, delivering platform functionality, improving the Yangu experience, and sending essential communications related to your account.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">3. Data Sharing</h2>
          <p className="text-muted-foreground leading-relaxed">
            We do not sell your personal data. We may share data with trusted infrastructure providers solely to operate and maintain our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">4. Security</h2>
          <p className="text-muted-foreground leading-relaxed">
            We use industry-standard safeguards to protect your data from unauthorized access, disclosure, alteration, or destruction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">5. Contact</h2>
          <p className="text-muted-foreground leading-relaxed">
            If you have questions about this policy, contact us at{" "}
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
