import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { YanguPageBackground } from "@/components/brand/YanguPageBackground";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <YanguPageBackground contentClassName="min-h-dvh flex items-center justify-center px-6">
      <main className="text-center">
        <h1
          className="select-none font-black leading-none tracking-tight"
          style={{
            fontSize: "clamp(6rem, 26vw, 16rem)",
            background:
              "linear-gradient(120deg, hsl(var(--yangu-green-hsl) / 0.95) 0%, hsl(150 20% 60% / 0.55) 35%, hsl(var(--yangu-orange-hsl) / 0.95) 70%, hsl(var(--yangu-green-hsl) / 0.9) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter:
              "drop-shadow(0 0 32px hsl(var(--yangu-orange-hsl) / 0.35)) drop-shadow(0 0 60px hsl(var(--yangu-green-hsl) / 0.28))",
          }}>
          404
        </h1>

        <p className="mx-auto mt-6 max-w-md text-lg text-foreground/90">
          Hmmmm... I couldn't find that page.
        </p>

        <div className="mt-8 flex justify-center">
          <Button asChild size="lg" className="min-w-[220px]">
            <a href="/">Back to home</a>
          </Button>
        </div>
      </main>
    </YanguPageBackground>
  );
};

export default NotFound;
