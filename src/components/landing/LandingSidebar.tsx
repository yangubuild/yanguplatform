import { Link } from "react-router-dom";
import { Youtube, Twitter, Instagram } from "lucide-react";
import yanguLogo from "@/assets/yangu-logo.png";

const navItems = [
  { label: "Explore", href: "/", active: true },
  { label: "Discover Yangu", href: "#discover" },
  { label: "Why Yangu", href: "#why" },
  { label: "Ada ai", href: "#ada" },
  { label: "Blog", href: "#blog" },
  { label: "Community", href: "#community" },
  { label: "Affiliates", href: "#affiliates" },
  { label: "Terms", href: "#terms" },
  { label: "Privacy", href: "#privacy" },
];

export function LandingSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 flex-shrink-0 bg-[hsl(0_0%_7%)] border-r border-[hsl(0_0%_15%)] flex flex-col">
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={yanguLogo} alt="Yangu" className="h-8 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                to={item.href}
                className={`block px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  item.active
                    ? "bg-[hsl(15_77%_60%)] text-white"
                    : "text-[hsl(0_0%_70%)] hover:text-white hover:bg-[hsl(0_0%_12%)]"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-[hsl(0_0%_15%)]">
        {/* Social Icons */}
        <div className="flex items-center gap-4 mb-4">
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(0_0%_50%)] hover:text-white transition-colors"
          >
            <Youtube className="h-5 w-5" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(0_0%_50%)] hover:text-white transition-colors"
          >
            <Twitter className="h-5 w-5" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(0_0%_50%)] hover:text-white transition-colors"
          >
            <Instagram className="h-5 w-5" />
          </a>
        </div>

        {/* Endorsed By */}
        <div className="text-xs text-[hsl(0_0%_40%)]">
          <span>Endorsed by</span>
          <div className="mt-1 flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[hsl(15_77%_60%)] flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">P</span>
            </div>
            <span className="text-[hsl(0_0%_60%)] font-medium">plaiter</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
