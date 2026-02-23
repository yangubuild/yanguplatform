import { Link } from "react-router-dom";
import yanguYIcon from "@/assets/yangu-y-icon.png";

/**
 * LegalFooter – Shared footer with copyright + legal links.
 * Renders: © yangu 2026  ·  Terms of Service / Privacy Policy / AI Safety
 */
export function LegalFooter() {
  return (
    <footer className="py-8 text-center">
      <div className="flex items-center justify-center gap-1.5 text-white/35 text-sm flex-wrap">
        <Link to="/termsofservice" className="hover:text-white/60 transition-colors">Terms of Service</Link>
        <span>/</span>
        <Link to="/privacypolicy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
        <span className="mx-1.5 text-white/20">·</span>
        <span className="text-white/50">©</span>
        <img src={yanguYIcon} alt="yangu" className="w-4 h-4 opacity-50" />
        <span className="text-white/50">yangu 2026</span>
        <span className="mx-1.5 text-white/20">·</span>
        <Link to="/aisafety" className="hover:text-white/60 transition-colors">AI Safety</Link>
      </div>
    </footer>
  );
}
