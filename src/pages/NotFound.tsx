import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { YanguPageBackground } from "@/components/brand/YanguPageBackground";
import yangu404 from "@/assets/yangu-404.png";

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
        <img
          src={yangu404}
          alt="404 — page not found"
          className="mx-auto w-full max-w-[520px] select-none object-contain"
          draggable={false}
        />

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
