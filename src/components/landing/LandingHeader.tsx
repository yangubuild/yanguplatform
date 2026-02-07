import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  return (
    <header className="flex items-center justify-end gap-3 px-6 py-4">
      <Link to="/auth/login">
        <Button
          variant="outline"
          className="rounded-full border-[hsl(0_0%_25%)] bg-transparent text-white hover:bg-[hsl(0_0%_15%)] hover:text-white"
        >
          Sign in
        </Button>
      </Link>
      <Link to="/auth/signup">
        <Button className="rounded-full bg-[hsl(15_77%_60%)] text-white hover:bg-[hsl(15_77%_55%)]">
          Start selling
        </Button>
      </Link>
    </header>
  );
}
