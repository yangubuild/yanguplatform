import { Link } from "react-router-dom";
import { Youtube, Twitter, Instagram } from "lucide-react";
import { T } from "@/lib/typography";

export function LandingTestFooter() {
  return (
    <footer className="py-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${T.body}`} style={{ color: 'rgba(255,255,255,0.4)' }}>
        <div className="flex items-center gap-x-5 gap-y-2 flex-wrap">
          <Link to="/why-yangu" className="hover:text-white/60 transition-colors">Mission</Link>
          <span className="hover:text-white/60 transition-colors cursor-pointer">Press</span>
          <Link to="/termsofservice" className="hover:text-white/60 transition-colors">Terms</Link>
          <Link to="/privacypolicy" className="hover:text-white/60 transition-colors">Privacy</Link>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>© yangu 2026</span>
          <Link to="/aisafety" className="hover:text-white/60 transition-colors">AI Safety</Link>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="text-white/40 hover:text-white/70 transition-colors"><Youtube className="w-5 h-5" /></a>
          <a href="#" className="text-white/40 hover:text-white/70 transition-colors"><Twitter className="w-5 h-5" /></a>
          <a href="#" className="text-white/40 hover:text-white/70 transition-colors"><Instagram className="w-5 h-5" /></a>
        </div>
      </div>
    </footer>
  );
}
