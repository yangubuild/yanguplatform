import { Link } from "react-router-dom";
import yanguYIcon from "@/assets/yangu-y-icon.png";

/**
 * LegalFooter – Shared footer with copyright + legal links.
 * Renders: © yangu 2026  ·  Terms of Service / Privacy Policy / AI Safety
 */
export function LegalFooter() {
  return (
    <footer className="py-8 text-center">
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground text-sm flex-wrap">
        <Link to="/termsofservice" className="hover:text-muted-foreground transition-colors">Terms of Service</Link>
        <span>/</span>
        <Link to="/privacypolicy" className="hover:text-muted-foreground transition-colors">Privacy Policy</Link>
        <span className="mx-1.5 text-muted-foreground">·</span>
        <span className="text-muted-foreground">©</span>
        <img src={yanguYIcon} alt="yangu" className="w-4 h-4 opacity-50" />
        <span className="text-muted-foreground">yangu 2026</span>
        <span className="mx-1.5 text-muted-foreground">·</span>
        <Link to="/aisafety" className="hover:text-muted-foreground transition-colors">AI Safety</Link>
        <span className="mx-1.5 text-muted-foreground">·</span>
        <Link to="/support" className="hover:text-muted-foreground transition-colors">Support</Link>
      </div>
    </footer>
  );
}
