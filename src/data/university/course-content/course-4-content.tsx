export interface LessonContent {
  title: string;
  readTime?: string;
  content: React.ReactNode;
}

export const COURSE_4_LESSONS: LessonContent[] = [
  {
    title: "Before You Choose a Platform, Understand This",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Understanding the foundation before choosing where to sell your digital products.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Platform Choice = Business Architecture</h2>
        <p>Where you sell your digital products shapes everything: how customers find you, how they pay, how they receive products, and how you scale. Choose wrong, and you'll spend months migrating. Choose right, and you build momentum from day one.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">What to Consider Before Choosing</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Your product type</strong> — Ebooks, courses, templates, and memberships all have different needs</li>
          <li><strong>Your audience</strong> — Where do they already shop?</li>
          <li><strong>Your technical skills</strong> — Some platforms are plug-and-play, others need setup</li>
          <li><strong>Your budget</strong> — Free platforms take a cut; paid platforms charge monthly</li>
          <li><strong>Your growth plans</strong> — Will this platform scale with you?</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💡</span>
          <p className="text-muted-foreground"><strong>Key Insight:</strong> There's no single "best" platform. The best platform is the one that matches your current needs AND allows room to grow.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> List your top 3 requirements for a selling platform (e.g., "easy setup," "low fees," "email integration").</p>
        </div>
      </>
    ),
  },
  {
    title: "The 6 Pillars Your Selling Platform Should Have",
    readTime: "6 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Essential features every selling platform needs to support your digital product business.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Non-Negotiable Features</h2>
        <ol className="list-decimal pl-6 space-y-4">
          <li><strong>Secure Payment Processing</strong><p className="text-muted-foreground mt-1">Accept credit cards, PayPal, and ideally Apple/Google Pay. Instant payouts preferred.</p></li>
          <li><strong>Digital Delivery</strong><p className="text-muted-foreground mt-1">Automatic file delivery after purchase. No manual sending.</p></li>
          <li><strong>Customizable Sales Pages</strong><p className="text-muted-foreground mt-1">Create branded product pages without needing a developer.</p></li>
          <li><strong>Analytics & Reporting</strong><p className="text-muted-foreground mt-1">Track sales, revenue, traffic sources, and conversion rates.</p></li>
          <li><strong>Email Integration</strong><p className="text-muted-foreground mt-1">Connect with your email marketing tool or have built-in email.</p></li>
          <li><strong>Customer Support Tools</strong><p className="text-muted-foreground mt-1">Handle refunds, inquiries, and customer communication easily.</p></li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Score each platform you're considering against these 6 pillars. The one with the highest score wins.</p>
        </div>
      </>
    ),
  },
  {
    title: "The Digital Presence Funnel",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">How to create a complete digital presence that drives sales and builds trust.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Your Digital Ecosystem</h2>
        <p>Your online presence isn't just one platform — it's an ecosystem of touchpoints that work together to attract, engage, and convert customers.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">The Presence Layers</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Discovery Layer</strong> — Social media, SEO, content (how people find you)</li>
          <li><strong>Trust Layer</strong> — Your website, testimonials, free content (why they believe you)</li>
          <li><strong>Conversion Layer</strong> — Product pages, checkout (where they buy)</li>
          <li><strong>Retention Layer</strong> — Email, community (how you keep them)</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Map out your presence across all 4 layers. Identify which layer needs the most attention.</p>
        </div>
      </>
    ),
  },
  {
    title: "Turn Your Website Into a Selling System",
    readTime: "7 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Build and optimize your own website to sell digital products directly to customers.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Your Website = Your Home Base</h2>
        <p>While marketplaces are great for discovery, your own website gives you full control over branding, pricing, customer data, and profit margins.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Website Platforms for Digital Products</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>WordPress + WooCommerce</strong> — Maximum flexibility, requires some setup</li>
          <li><strong>Shopify</strong> — Great for those who want simplicity with power</li>
          <li><strong>Squarespace</strong> — Beautiful designs, good for beginners</li>
          <li><strong>Carrd</strong> — Ultra-simple single-page sites for minimal budgets</li>
          <li><strong>Systeme.io</strong> — All-in-one: website + email + funnels + checkout</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Essential Pages</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Home page</strong> — Clear value proposition and navigation</li>
          <li><strong>Product pages</strong> — One per product with detailed descriptions</li>
          <li><strong>About page</strong> — Your story and credibility</li>
          <li><strong>Contact page</strong> — Easy way for customers to reach you</li>
          <li><strong>Blog</strong> — For SEO and content marketing</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Choose a website platform and set up your essential pages. Focus on the product page first — that's where sales happen.</p>
        </div>
      </>
    ),
  },
  {
    title: "Use a Link-in-Bio Tool as Your Sales Hub",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Leverage link-in-bio platforms to create a simple yet effective sales hub.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">The Simplest Starting Point</h2>
        <p>If building a website feels overwhelming, a link-in-bio tool can be your entire sales hub. It's a single page with all your products, links, and lead magnets.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Top Link-in-Bio Tools</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Stan Store</strong> — Built specifically for selling digital products. Checkout built in.</li>
          <li><strong>Linktree Pro</strong> — Simple and widely recognized</li>
          <li><strong>Beacons</strong> — Free tier with product selling capabilities</li>
          <li><strong>Koji</strong> — Interactive mini-apps for selling</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">⭐</span>
          <p className="text-muted-foreground"><strong>Best for Beginners:</strong> Stan Store is the top recommendation because it combines link-in-bio with built-in checkout, email collection, and product hosting.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Set up a Stan Store or link-in-bio page. Add your first product and link it in your social media bio.</p>
        </div>
      </>
    ),
  },
  {
    title: "Launch Fast on Top Digital Marketplaces",
    readTime: "6 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Get started quickly on established marketplaces with built-in audiences.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Why Marketplaces Matter</h2>
        <p>Marketplaces have built-in traffic. People go there specifically to buy. You skip the hardest part — finding customers — and focus on creating great products.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Top Marketplaces for Digital Products</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li><strong>Gumroad</strong> — Simple, creator-friendly, great for all digital products</li>
          <li><strong>Etsy</strong> — Massive audience, great for templates and printables</li>
          <li><strong>Creative Market</strong> — Ideal for designers selling assets and templates</li>
          <li><strong>Payhip</strong> — Low fees, supports memberships and courses</li>
          <li><strong>LemonSqueezy</strong> — Modern alternative with great developer features</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Marketplace Strategy</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Optimize titles</strong> — Use keywords buyers actually search for</li>
          <li><strong>Great thumbnails</strong> — Visual quality drives clicks</li>
          <li><strong>Detailed descriptions</strong> — Explain exactly what's included</li>
          <li><strong>Competitive pricing</strong> — Research similar products on the platform</li>
          <li><strong>Collect reviews</strong> — Social proof is everything on marketplaces</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> List your first product on Gumroad or Etsy today. It takes under 30 minutes.</p>
        </div>
      </>
    ),
  },
  {
    title: "Sell Online Courses Through Marketplaces",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Learn about course-specific marketplaces and how to leverage them for education products.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Course Platforms vs. General Marketplaces</h2>
        <p>If you're selling courses or educational content, dedicated course platforms offer features that general marketplaces don't — like progress tracking, quizzes, and certificates.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Top Course Platforms</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Udemy</strong> — Massive marketplace, but they control pricing</li>
          <li><strong>Skillshare</strong> — Subscription model, passive income from minutes watched</li>
          <li><strong>Teachable</strong> — Your own branded school, full pricing control</li>
          <li><strong>Thinkific</strong> — Similar to Teachable with a free tier</li>
          <li><strong>Podia</strong> — Simple all-in-one for courses, downloads, and community</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💡</span>
          <p className="text-muted-foreground"><strong>Strategy:</strong> Use marketplace platforms (Udemy, Skillshare) for discovery and lead generation. Use hosted platforms (Teachable, Thinkific) for premium courses where you control the experience and pricing.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> If you have course content, choose between marketplace vs. hosted and set up your first course.</p>
        </div>
      </>
    ),
  },
  {
    title: "How Payment Works on Each Platform",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Understanding payment processing, fees, and payout structures across platforms.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Know Your Numbers</h2>
        <p>Every platform takes a cut. Understanding fee structures ensures you price correctly and choose platforms that maximize your profit.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Fee Comparison</h2>
        <div className="space-y-4 mt-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">Gumroad</p>
            <p className="text-muted-foreground">10% per sale (includes payment processing)</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">Stan Store</p>
            <p className="text-muted-foreground">$29/mo flat fee, no transaction fees</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">Etsy</p>
            <p className="text-muted-foreground">6.5% transaction fee + $0.20 listing fee + payment processing</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">Payhip</p>
            <p className="text-muted-foreground">Free plan: 5% per sale. Plus plan: $29/mo, 2% fee</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">Stripe Direct</p>
            <p className="text-muted-foreground">2.9% + $0.30 per transaction (no platform fee)</p>
          </div>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Calculate your expected fees on 2-3 platforms based on your price point and expected monthly sales volume.</p>
        </div>
      </>
    ),
  },
  {
    title: "External Payment Systems for Digital Products",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Explore external payment processors for more control over your revenue.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Going Beyond Platform Payments</h2>
        <p>As you grow, you might want more control over payments — lower fees, custom checkout, subscription management, and multi-currency support.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Top Payment Processors</h2>
        <ul className="list-disc pl-6 space-y-3">
          <li><strong>Stripe</strong> — The industry standard. Clean API, supports everything. 2.9% + $0.30</li>
          <li><strong>PayPal</strong> — Trusted by buyers worldwide. Easy integration.</li>
          <li><strong>LemonSqueezy</strong> — Built for digital products. Handles tax collection globally.</li>
          <li><strong>Paddle</strong> — Merchant of record. They handle taxes, billing, and compliance.</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🌍</span>
          <p className="text-muted-foreground"><strong>Tax Tip:</strong> LemonSqueezy and Paddle handle sales tax/VAT collection automatically. This is huge if you're selling internationally.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Set up a Stripe account (free) so you're ready to connect it to any platform or tool you choose.</p>
        </div>
      </>
    ),
  },
  {
    title: "Your Digital Business Starts Here",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Final insights and next steps for launching your digital product business.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">You Have Everything You Need</h2>
        <p>You now understand the platform landscape. You know the pros and cons, the fees, and the features. The only thing left is to choose and launch.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Recommended Starting Setup</h2>
        <div className="space-y-4 mt-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">🎯 For Absolute Beginners</h3>
            <p className="text-muted-foreground mt-2">Stan Store + Instagram + Free email tool (MailerLite)</p>
            <p className="text-muted-foreground">Total cost: $29/month</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">📈 For Growing Businesses</h3>
            <p className="text-muted-foreground mt-2">Own website + Gumroad + ConvertKit + Multiple social channels</p>
            <p className="text-muted-foreground">Total cost: $30-60/month</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">🚀 For Scaling Businesses</h3>
            <p className="text-muted-foreground mt-2">WordPress + Stripe + Systeme.io + Paid ads + Full email automation</p>
            <p className="text-muted-foreground">Total cost: $50-100/month</p>
          </div>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎉</span>
          <p className="text-muted-foreground"><strong>Congratulations!</strong> You've completed "Where to Sell Digital Products." Pick your platform, list your first product, and start selling today.</p>
        </div>
      </>
    ),
  },
];
