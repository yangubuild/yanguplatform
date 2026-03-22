const COMPLETED_PRODUCTS = [
  { title: "How to Build a Consistent Visual Identity", cover: "https://entrepedia-products.com/covers/1771393353880-Book-Cover.jpg" },
  { title: "Merch That Sticks", cover: "https://entrepedia-products.com/covers/1760962519464-Book-Cover.jpg" },
  { title: "Self-Coaching Mastery", cover: "https://entrepedia-products.com/covers/1762245316686-Book-Cover.jpg" },
  { title: "Growth with Social Proof", cover: "https://entrepedia-products.com/covers/1759145772267-Book-Cover.png" },
  { title: "Break Free from the Cortisol Cycle", cover: "https://entrepedia-products.com/covers/1756891161530-Book-Cover.jpg" },
  { title: "Content Marketing for Small Businesses", cover: "https://entrepedia-products.com/covers/1763998926601-Book-Cover.jpg" },
  { title: "The Psychology of Closing", cover: "https://entrepedia-products.com/covers/1769609972240-Book-Cover.jpg" },
  { title: "Buy Back Your Time", cover: "https://entrepedia-products.com/covers/1761572285390-Book-Cover.jpg" },
  { title: "The Power of Dark Femininity", cover: "https://entrepedia-products.com/covers/1763378343976-Book-Cover.jpg" },
  { title: "Attract Love", cover: "https://entrepedia-products.com/covers/1772629894364-Book-Cover.jpg" },
  { title: "Sleep Smarter for a Better Life", cover: "https://entrepedia-products.com/covers/1758554147224-Book-Cover.jpg" },
  { title: "How to Franchise Your Business", cover: "https://entrepedia-products.com/covers/1755589595128-Book-Cover.jpg" },
  { title: "Product Launch Storytelling Secrets", cover: "https://entrepedia-products.com/covers/1761029784326-Book-Cover.jpg" },
  { title: "Protect Your Digital Life", cover: "https://entrepedia-products.com/covers/1753709191573-protect-your-digital-life-cover.jpg" },
  { title: "SEO-Driven Storytelling Advantage", cover: "https://entrepedia-products.com/covers/1762180029345-Book-Cover.jpg" },
  { title: "Sales Automation Chatbots", cover: "https://entrepedia-products.com/covers/1773145263335-Book-Cover.jpg" },
  { title: "AI Profit Mastery for Small Business", cover: "https://entrepedia-products.com/covers/1763388726112-Book-Cover.jpg" },
  { title: "The Power of TikTok Shop", cover: "https://entrepedia-products.com/covers/1758560959153-Book-Cover.jpg" },
  { title: "Level Up Your Emotional Intelligence", cover: "https://entrepedia-products.com/covers/1753707892454-level-up-your-emotional-intelligence-cover.jpg" },
  { title: "The Neuroscience of Peak Productivity", cover: "https://entrepedia-products.com/covers/1768932212304-Book-Cover.jpg" },
  { title: "AI-Ready Change Management Playbook", cover: "https://entrepedia-products.com/covers/1760362115332-Book-Cover.jpg" },
  { title: "Creating the Perfect Customer Experience", cover: "https://entrepedia-products.com/covers/1756887551243-Book-Cover.jpg" },
  { title: "The Eisenhower Matrix Blueprint", cover: "https://entrepedia-products.com/covers/1764594438591-Book-Cover.jpg" },
  { title: "Digital Detox for Founders", cover: "https://entrepedia-products.com/covers/1767881607041-Book-Cover.jpg" },
  { title: "Deal-Breaking Case Studies Creation", cover: "https://entrepedia-products.com/covers/1756191878174-Book-Cover.jpg" },
  { title: "Writing Content That Sells Without Sounding Salesy", cover: "https://entrepedia-products.com/covers/1757943949361-Book-Cover.jpg" },
  { title: "Content Marketing on Steroids", cover: "https://entrepedia-products.com/covers/1765120694262-Book-Cover.jpg" },
  { title: "Monetizing Attention Without Selling Your Soul", cover: "https://entrepedia-products.com/covers/1768986968170-Book-Cover.jpg" },
  { title: "Blockchain Basics", cover: "https://entrepedia-products.com/covers/1765117262672-Book-Cover.jpg" },
  { title: "Prioritize Your Life", cover: "https://entrepedia-products.com/covers/1757418521707-Book-Cover.jpg" },
  { title: "The 15-Minute Wellness Blueprint", cover: "https://entrepedia-products.com/covers/1762791625851-Book-Cover.jpg" },
  { title: "Phishing Exposed", cover: "https://entrepedia-products.com/covers/1755078590685-Book-Cover.jpg" },
  { title: "Fitness Without Hustle", cover: "https://entrepedia-products.com/covers/1770205928467-Book-Cover.jpg" },
  { title: "The Brand Evolution System for Modern Creators", cover: "https://entrepedia-products.com/covers/1768241246342-Book-Cover.jpg" },
  { title: "The Beginner's Guide to Content Marketing", cover: "https://entrepedia-products.com/covers/1765827711135-Book-Cover.jpg" },
  { title: "Online Business Security Best Practices", cover: "https://entrepedia-products.com/covers/1761577983963-Book-Cover.jpg" },
  { title: "Confidence That Shows Before You Speak", cover: "https://entrepedia-products.com/covers/1759137036394-Book-Cover.jpg" },
  { title: "Monetize Your Micro-Audience", cover: "https://entrepedia-products.com/covers/1764001408947-Book-Cover.jpg" },
  { title: "Humanize Your AI Copy", cover: "https://entrepedia-products.com/covers/1772201302844-Book-Cover.jpg" },
  { title: "Mindfulness at Work", cover: "https://entrepedia-products.com/covers/1760359111894-Book-Cover.jpg" },
  { title: "The Advertising Funnel Blueprint Strategies", cover: "https://entrepedia-products.com/covers/1753707817705-ad-funnel-blueprint-cover.png" },
  { title: "The Modern Estate Manager", cover: "https://entrepedia-products.com/covers/1768314895542-Book-Cover.jpg" },
  { title: "Atomic Execution", cover: "https://entrepedia-products.com/covers/1755071343800-Book-Cover.jpg" },
  { title: "Content Marketing Analytics & ROI", cover: "https://entrepedia-products.com/covers/1765823540815-Book-Cover.jpg" },
  { title: "Agency Growth Blueprint", cover: "https://entrepedia-products.com/covers/1769612344758-Book-Cover.jpg" },
  { title: "High-Converting Landing Page Frameworks", cover: "https://entrepedia-products.com/covers/1756212836867-Book-Cover.jpg" },
  { title: "Master a New Professional Skill in One Month", cover: "https://entrepedia-products.com/covers/1765820378524-Book-Cover.jpg" },
  { title: "Package What You Know Into a High-Ticket Offer", cover: "https://entrepedia-products.com/covers/1773150661144-Book-Cover.jpg" },
  { title: "The Mindful Manifestation", cover: "https://entrepedia-products.com/covers/1755597041969-Book-Cover.jpg" },
  { title: "The Business Model Blueprint", cover: "https://entrepedia-products.com/covers/1762786018862-Book-Cover.jpg" },
];

export default function CompletedProducts() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {COMPLETED_PRODUCTS.map((product) => (
        <div
          key={product.title}
          className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/20 transition-colors">
          <div className="bg-muted/30">
            <img
              src={product.cover}
              alt={product.title}
              className="w-full h-auto block"
              loading="lazy"
            />
          </div>
          <div className="p-3">
            <h4 className="text-xs font-medium text-foreground line-clamp-2 leading-relaxed">
              {product.title}
            </h4>
          </div>
        </div>
      ))}
    </div>
  );
}
