import { Link } from "react-router-dom";
import yanguYIcon from "@/assets/yangu-y-icon.png";

/**
 * LegalFooter – Shared footer with copyright + legal links.
 * Renders: © yangu 2026  ·  Terms of Service / Privacy Policy / AI Safety
 */
export function LegalFooter() {
  return (
    <footer className="py-8 text-center">
      <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
        <span>©</span>
        <img src={yanguYIcon} alt="yangu" className="w-4 h-4 opacity-50" />
        <span>yangu 2026</span>
      </div>
      <div className="flex items-center justify-center gap-1 mt-3 text-white/35 text-xs">
        <Link to="/termsofservice" className="hover:text-white/60 transition-colors">Terms of Service</Link>
        <span>/</span>
        <Link to="/privacypolicy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
        <span>/</span>
        <Link to="/aisafety" className="hover:text-white/60 transition-colors">AI Safety</Link>
      </div>
    </footer>
  );
}
