export interface LessonContent {
  title: string;
  readTime?: string;
  content: React.ReactNode;
}

export const COURSE_2_LESSONS: LessonContent[] = [
  {
    title: "The Adventure Begins",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Start your journey into building a profitable online business with clarity and confidence.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">Welcome to Your Online Business Journey</h2>
        <p>
          You're here because you want more — more freedom, more income, more control over your time.
          Building an online business isn't just about money. It's about creating a life where you work on
          your terms, from anywhere, doing something meaningful.
        </p>
        <p>
          This course will walk you through every step of launching a profitable online business selling
          digital products. No fluff, no hype — just actionable steps you can follow.
        </p>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🗺️</span>
          <p className="text-muted-foreground">
            <strong>What You'll Learn:</strong> By the end of this course, you'll have a clear business plan,
            a branded product ready to sell, a marketing strategy, and the confidence to launch.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">The Digital Product Opportunity</h2>
        <p>Why digital products? Because they're the ultimate business model:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Zero inventory</strong> — No storage, no shipping, no physical overhead</li>
          <li><strong>Infinite scalability</strong> — Sell one copy or ten thousand with the same effort</li>
          <li><strong>High margins</strong> — 90%+ profit on every sale</li>
          <li><strong>Passive income potential</strong> — Sell while you sleep once systems are set up</li>
          <li><strong>Location freedom</strong> — Run your business from anywhere with WiFi</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-10">The Mindset Shift</h2>
        <p>
          Before we dive into strategy, let's address the biggest obstacle: <strong>yourself.</strong>
        </p>
        <p>
          Imposter syndrome, fear of failure, perfectionism — these are the real enemies.
          Not competition, not algorithms, not lack of capital. The people who succeed aren't
          smarter or more talented. They simply start, learn from mistakes, and keep going.
        </p>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground">
            <strong>Action Step:</strong> Write down your "why" — why do you want to build an online business?
            Keep it somewhere visible. You'll need it on hard days.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Find Your Business Purpose",
    readTime: "7 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Discover your niche and define your business mission with purpose-driven strategy.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">Why Niche Matters</h2>
        <p>
          "Sell to everyone" is the fastest way to sell to no one. Your niche is the intersection of
          three things: what you know, what people need, and what you enjoy talking about.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">The Niche Formula</h2>
        <p>Find your sweet spot with this framework:</p>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Your Knowledge</strong> — What do you know more about than the average person?</li>
          <li><strong>Market Demand</strong> — Are people actively searching for solutions in this area?</li>
          <li><strong>Your Passion</strong> — Can you talk about this topic for months without getting bored?</li>
        </ol>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎯</span>
          <p className="text-muted-foreground">
            <strong>Profitable Niche Examples:</strong> Personal finance for freelancers, Productivity for remote workers,
            Health & wellness for busy parents, Social media growth for small businesses, Career development for Gen Z.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">Validating Your Niche</h2>
        <p>Before committing, validate that your niche has demand:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Search volume:</strong> Are people Googling topics in your niche?</li>
          <li><strong>Competition:</strong> Do other products exist? (Competition = demand)</li>
          <li><strong>Community:</strong> Are there active groups, subreddits, or forums?</li>
          <li><strong>Willingness to pay:</strong> Are people already buying similar products?</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-10">Define Your Business Mission</h2>
        <p>Write a one-sentence mission statement:</p>
        <p className="italic border-l-4 border-primary pl-4 my-4">
          "I help [specific audience] achieve [specific result] through [your method/products]."
        </p>
        <p>Example: "I help new freelancers build a sustainable business through actionable guides and templates."</p>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground">
            <strong>Action Step:</strong> Write your niche statement and mission. Then find 3 communities online
            where your target audience hangs out.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Branding & Visual Identity",
    readTime: "8 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Create a brand that stands out and resonates with your target audience.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">Your Brand Is More Than a Logo</h2>
        <p>
          Your brand is the feeling people get when they interact with your business. It's the colors,
          the words, the vibe, the consistency. A strong brand builds trust before you say a single word.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">Building Your Visual Identity</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong>Choose Your Brand Colors</strong>
            <p className="mt-1 text-muted-foreground">Pick 2-3 colors that match your brand personality. Warm tones for energy, cool tones for trust, neutrals for sophistication.</p>
          </li>
          <li>
            <strong>Select Your Typography</strong>
            <p className="mt-1 text-muted-foreground">One display font for headlines, one clean font for body text. Keep it consistent everywhere.</p>
          </li>
          <li>
            <strong>Create Visual Templates</strong>
            <p className="mt-1 text-muted-foreground">Design templates for social posts, product covers, and marketing materials. Reuse them endlessly.</p>
          </li>
          <li>
            <strong>Design Your Logo</strong>
            <p className="mt-1 text-muted-foreground">A simple text-based logo is perfectly fine to start. Don't overthink this.</p>
          </li>
        </ol>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎨</span>
          <p className="text-muted-foreground">
            <strong>Free Tools:</strong> Canva for design, Coolors.co for color palettes, Google Fonts for typography,
            Favicon.io for favicons.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">Brand Voice Guide</h2>
        <p>Your brand voice should be consistent across all touchpoints. Define:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Tone:</strong> Professional, casual, playful, authoritative?</li>
          <li><strong>Language:</strong> Simple, technical, inspirational, direct?</li>
          <li><strong>Perspective:</strong> First person (I/we), second person (you)?</li>
          <li><strong>Personality:</strong> If your brand were a person, who would they be?</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground">
            <strong>Action Step:</strong> Create your brand kit in Canva with your chosen colors, fonts, and a simple logo.
            Apply it to one product today.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Build Offers People Can't Refuse",
    readTime: "7 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Design irresistible product offerings that solve real problems and drive sales.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">Products vs. Offers</h2>
        <p>
          A product is what you sell. An <strong>offer</strong> is how you position it. The same ebook
          priced at $19 with a boring description will sell 10 copies. The same ebook packaged as
          "The Complete Starter Kit" with bonuses, a guarantee, and urgency will sell 100.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">The Irresistible Offer Formula</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Core Product</strong> — The main item they're buying</li>
          <li><strong>Bonuses</strong> — 2-3 extras that increase perceived value (checklists, templates, guides)</li>
          <li><strong>Guarantee</strong> — Remove the risk (money-back guarantee or similar)</li>
          <li><strong>Urgency</strong> — A reason to buy now (limited time, limited quantity, launch pricing)</li>
          <li><strong>Social Proof</strong> — Testimonials, results, or numbers that build trust</li>
        </ol>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💰</span>
          <p className="text-muted-foreground">
            <strong>Example:</strong> Instead of selling "Instagram Growth Ebook — $19," sell "The Instagram Growth System —
            Includes the 90-page guide + content calendar template + 50 viral hooks + hashtag toolkit.
            Launch price: $27 (normally $47)."
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">Pricing Psychology</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Anchor high:</strong> Show the total value before your price</li>
          <li><strong>Use odd numbers:</strong> $27 feels more intentional than $25</li>
          <li><strong>Offer tiers:</strong> Give people a basic and premium option</li>
          <li><strong>Never compete on price alone:</strong> Compete on value and positioning</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground">
            <strong>Action Step:</strong> Take your first product and turn it into an offer. Add 2 bonuses from the
            Master Library, write the total value, and set a launch price.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Ready-Made. Ready to Sell. Ready for You.",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Leverage pre-made digital products to fast-track your business launch.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">The Fast-Track Advantage</h2>
        <p>
          Most entrepreneurs spend months creating their first product. With the Master Library,
          you can have a branded, customized product ready to sell in a single afternoon.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">Types of Products Available</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Ebooks & Guides</strong> — In-depth written content on profitable topics</li>
          <li><strong>Video Courses</strong> — Pre-recorded training content</li>
          <li><strong>Templates & Checklists</strong> — Actionable tools your audience can use immediately</li>
          <li><strong>Audio Content</strong> — Podcasts and audio guides</li>
          <li><strong>Bundles</strong> — Pre-packaged product collections</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-10">How to Choose the Right Product</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Match your niche</strong> — Does this product solve a problem your audience has?</li>
          <li><strong>Check the quality</strong> — Is the design professional? Is the content valuable?</li>
          <li><strong>Assess customization needs</strong> — How much work to make it "yours"?</li>
          <li><strong>Consider the price point</strong> — Can you sell it at a price that makes sense?</li>
        </ol>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">⚡</span>
          <p className="text-muted-foreground">
            <strong>Speed Hack:</strong> Start with products that need minimal customization. Change the colors,
            add your logo, and you're ready to sell. Save the deep customizations for later.
          </p>
        </div>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground">
            <strong>Action Step:</strong> Browse the Master Library right now. Select 3 products that match your niche
            and save them to your shortlist.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Building Your Online Presence",
    readTime: "7 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Establish a professional online presence that attracts and converts visitors.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">Your Digital Storefront</h2>
        <p>
          Your online presence is your storefront. It's where people discover you, learn to trust you,
          and decide to buy from you. You don't need a complex website — you need a clear, professional
          presence that communicates value.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">Essential Online Presence Elements</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong>Product Page or Website</strong>
            <p className="mt-1 text-muted-foreground">Use Gumroad, Stan Store, or a simple landing page. You don't need a full website on day one.</p>
          </li>
          <li>
            <strong>Social Media Profile</strong>
            <p className="mt-1 text-muted-foreground">Pick 1-2 platforms. Bio should clearly state who you help and how.</p>
          </li>
          <li>
            <strong>Email List</strong>
            <p className="mt-1 text-muted-foreground">Start collecting emails from day one with a free lead magnet.</p>
          </li>
          <li>
            <strong>Link-in-Bio Page</strong>
            <p className="mt-1 text-muted-foreground">A single link that houses all your important links and products.</p>
          </li>
        </ol>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🏗️</span>
          <p className="text-muted-foreground">
            <strong>Minimum Viable Presence:</strong> You can launch with just a Stan Store + Instagram profile +
            email signup. Total setup time: under 2 hours.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">Optimizing Your Profile</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Profile photo:</strong> Professional headshot or branded logo</li>
          <li><strong>Bio:</strong> Who you help + what you offer + call to action</li>
          <li><strong>Pinned content:</strong> Your best-performing or most important post</li>
          <li><strong>Link:</strong> Direct to your product page or link-in-bio</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground">
            <strong>Action Step:</strong> Set up your minimum viable online presence today — a product page,
            optimized social profile, and email signup form.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Build an Audience That Buys",
    readTime: "8 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Grow a loyal community that trusts your brand and purchases your products.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">Audience Before Everything</h2>
        <p>
          An audience is not just followers or subscribers. It's a group of people who trust you enough
          to open your emails, engage with your content, and buy your products. Building an audience
          that buys is the most valuable skill in online business.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">The Value-First Approach</h2>
        <p>
          Give before you ask. Every piece of content should provide genuine value — a tip, an insight,
          a tool, a framework. When you consistently help people for free, selling becomes easy because
          they already trust you.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">Content That Builds Trust</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Educational posts:</strong> Teach something actionable in your niche</li>
          <li><strong>Behind-the-scenes:</strong> Show your process and journey</li>
          <li><strong>Results and proof:</strong> Share wins, metrics, and transformations</li>
          <li><strong>Stories:</strong> Personal experiences that your audience relates to</li>
          <li><strong>Curated resources:</strong> Share useful tools and links</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">📊</span>
          <p className="text-muted-foreground">
            <strong>The 80/20 Rule:</strong> 80% of your content should educate, inspire, or entertain.
            20% should promote your products. This ratio builds trust while still driving sales.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">Growing Your Email List</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Create a lead magnet</strong> — A free resource that solves one specific problem</li>
          <li><strong>Promote it everywhere</strong> — Social bio, posts, stories, website</li>
          <li><strong>Deliver value in emails</strong> — Don't just pitch; teach and share</li>
          <li><strong>Nurture consistently</strong> — Email at least weekly to stay top of mind</li>
        </ol>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground">
            <strong>Action Step:</strong> Create a lead magnet using a product from the Master Library. Set up a
            signup page and promote it on your social media today.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Marketing & Traffic Generation",
    readTime: "8 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Master proven strategies to drive targeted traffic and increase conversions.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">Traffic Is the Lifeblood</h2>
        <p>
          You can have the best product in the world, but without traffic, no one will ever see it.
          Traffic generation is about getting the right people to your product page consistently.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">Free Traffic Strategies</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong>Content Marketing</strong>
            <p className="mt-1 text-muted-foreground">Create valuable content that ranks on Google or gets shared on social media.</p>
          </li>
          <li>
            <strong>Social Media Organic</strong>
            <p className="mt-1 text-muted-foreground">Post consistently with a mix of value, engagement, and promotion.</p>
          </li>
          <li>
            <strong>SEO</strong>
            <p className="mt-1 text-muted-foreground">Optimize your product pages for search terms your audience uses.</p>
          </li>
          <li>
            <strong>Community Engagement</strong>
            <p className="mt-1 text-muted-foreground">Be active in Facebook groups, subreddits, and forums where your audience gathers.</p>
          </li>
        </ol>

        <h2 className="text-2xl font-bold text-foreground mt-10">Paid Traffic Strategies</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Facebook/Instagram Ads</strong> — Start with $5-10/day testing different audiences</li>
          <li><strong>Pinterest Ads</strong> — Great for visual products and evergreen content</li>
          <li><strong>Google Ads</strong> — Capture people actively searching for solutions</li>
          <li><strong>Influencer collaborations</strong> — Pay micro-influencers to promote your products</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">⚡</span>
          <p className="text-muted-foreground">
            <strong>Start Free, Scale Paid:</strong> Master free traffic first. Once you know which products sell and
            which messaging works, amplify with paid ads for predictable growth.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">Conversion Optimization</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Clear headlines</strong> that state the benefit</li>
          <li><strong>Social proof</strong> — testimonials, reviews, download counts</li>
          <li><strong>Strong CTAs</strong> — Tell people exactly what to do next</li>
          <li><strong>Urgency</strong> — Limited-time offers or bonuses</li>
          <li><strong>Mobile optimization</strong> — Most buyers browse on their phones</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground">
            <strong>Action Step:</strong> Choose 2 free traffic channels and create your first 7 pieces of content.
            Schedule them for the week ahead.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Wrapping It Up",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Bring it all together with final insights and your next steps to success.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">Your Journey So Far</h2>
        <p>Let's recap what you've accomplished in this course:</p>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Defined your purpose</strong> — You know your niche and who you serve</li>
          <li><strong>Built your brand</strong> — Visual identity, voice, and positioning</li>
          <li><strong>Created irresistible offers</strong> — Products packaged for maximum value</li>
          <li><strong>Leveraged ready-made products</strong> — Fast-tracked your product catalog</li>
          <li><strong>Established your presence</strong> — Digital storefront and social profiles</li>
          <li><strong>Built an audience</strong> — Email list and community engagement</li>
          <li><strong>Generated traffic</strong> — Free and paid strategies to reach buyers</li>
        </ol>

        <h2 className="text-2xl font-bold text-foreground mt-10">The 90-Day Growth Plan</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Month 1:</strong> Launch 2-3 products, build email list to 100 subscribers, post daily</li>
          <li><strong>Month 2:</strong> Optimize bestsellers, launch a bundle, test paid ads</li>
          <li><strong>Month 3:</strong> Scale what works, add new products, build partnerships</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🏆</span>
          <p className="text-muted-foreground">
            <strong>Final Reminder:</strong> The difference between a plan and a business is execution.
            Don't just read this course — implement it. Start today. Start imperfectly. Start now.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">What's Next?</h2>
        <p>
          Continue your learning journey with the other courses in the Master Library Masterclass:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>How to Use Funnels</strong> — Build automated sales systems</li>
          <li><strong>Where to Sell Digital Products</strong> — Choose the right platforms</li>
          <li><strong>How to Price Digital Products</strong> — Price with confidence</li>
          <li><strong>How to Write Effective Copy</strong> — Words that sell</li>
          <li><strong>How to Design Stunning Visuals</strong> — Visuals that convert</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎉</span>
          <p className="text-muted-foreground">
            <strong>Congratulations!</strong> You've completed the Online Business Master Plan.
            Your journey starts now — go make it happen.
          </p>
        </div>
      </>
    ),
  },
];
