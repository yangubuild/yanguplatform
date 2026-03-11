export interface LessonContent {
  title: string;
  readTime?: string;
  content: React.ReactNode;
}

export const COURSE_6_LESSONS: LessonContent[] = [
  {
    title: "Why Copywriting Matters More Than You Think",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Understand why your words are the bridge between your product and your buyers.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Words Sell. Design Gets Attention. Copy Closes.</h2>
        <p>You can have the most beautiful product page in the world — but if the words don't connect, nobody buys. Copywriting is the skill that turns browsers into buyers, followers into customers, and products into income.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Where Copy Lives</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Product titles and descriptions</li>
          <li>Sales pages and landing pages</li>
          <li>Email sequences</li>
          <li>Social media captions</li>
          <li>Ads and CTAs</li>
          <li>Even your bio and "About" page</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💡</span>
          <p className="text-muted-foreground"><strong>Key Insight:</strong> Good copy doesn't sound like "selling." It sounds like someone who understands your problem offering a genuine solution.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Look at your current product description. Does it talk about features or outcomes? Rewrite it to focus on what the customer gets.</p>
        </div>
      </>
    ),
  },
  {
    title: "Your Name Is Your First Sales Pitch",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Learn why your product name matters and how to make it stand out.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">The Power of a Great Name</h2>
        <p>Your product name is the first thing people see. It needs to communicate value, create curiosity, and be memorable — all in 3-7 words.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Name Formulas That Work</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>"The [Outcome] [Format]"</strong> — The Content Creator's Playbook</li>
          <li><strong>"[Number]-[Timeframe] [Result]"</strong> — 7-Day Launch Blueprint</li>
          <li><strong>"[Adjective] [Topic] [System]"</strong> — The Ultimate Pricing System</li>
          <li><strong>"[Audience]'s Guide to [Result]"</strong> — The Freelancer's Guide to $10K Months</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">❌</span>
          <p className="text-muted-foreground"><strong>Avoid:</strong> Generic names like "Marketing Ebook" or "Business Guide." They say nothing about what makes your product special.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Brainstorm 10 names for your product using the formulas above. Pick the one that's most specific and compelling.</p>
        </div>
      </>
    ),
  },
  {
    title: "How to Name for Desire (Not Description)",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Create product names that trigger emotion and desire.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Description vs. Desire</h2>
        <p>Descriptive names tell people what something is. Desire-driven names tell them what it will do for them.</p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li>❌ "Social Media Template Pack" → ✅ "The Scroll-Stopping Content Kit"</li>
          <li>❌ "Budgeting Spreadsheet" → ✅ "The Money Clarity System"</li>
          <li>❌ "Email Writing Course" → ✅ "Emails That Print Money"</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎯</span>
          <p className="text-muted-foreground"><strong>Rule:</strong> Your name should make someone think "I need that" — not just "I understand what that is."</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Rewrite your product name to focus on the desired outcome, not the format.</p>
        </div>
      </>
    ),
  },
  {
    title: "Using Taglines to Add Instant Clarity",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Craft taglines that clarify value and make your product instantly understandable.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Your Tagline = Your Elevator Pitch</h2>
        <p>A tagline sits under your product name and instantly communicates what it is, who it's for, and what they'll get.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Tagline Formulas</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>"[Result] without [pain point]"</strong> — "Launch your first product without tech overwhelm"</li>
          <li><strong>"The [simplest/fastest] way to [result]"</strong> — "The simplest way to build a 6-figure brand"</li>
          <li><strong>"Everything you need to [result]"</strong> — "Everything you need to write copy that converts"</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Write 5 tagline options for your product. Pick the clearest one and add it to your sales page.</p>
        </div>
      </>
    ),
  },
  {
    title: "Stop Talking About Features — Start Selling Outcomes",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Shift from listing features to communicating the real transformations your product delivers.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Features Tell. Benefits Sell.</h2>
        <p>Nobody cares that your ebook has 90 pages, 12 chapters, and 50 templates — unless you tell them what those things will DO for them.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Feature → Benefit Translation</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Feature:</strong> "50 social media templates" → <strong>Benefit:</strong> "Never stare at a blank screen again — post content every day for 2 months"</li>
          <li><strong>Feature:</strong> "Step-by-step video training" → <strong>Benefit:</strong> "Follow along and launch your first product this weekend"</li>
          <li><strong>Feature:</strong> "Editable Canva files" → <strong>Benefit:</strong> "Customize everything to match your brand in minutes, no design skills needed"</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Take every feature in your product description and add "so you can..." to turn it into a benefit.</p>
        </div>
      </>
    ),
  },
  {
    title: "Writing Like a Mirror: Make It About Them",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Master the art of customer-centric writing that speaks directly to your audience's needs.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">The "You" Principle</h2>
        <p>Great copy is a mirror. Your reader should feel like you're describing their exact situation, their frustrations, and their goals. Use "you" more than "I" or "we."</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Before & After</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>❌ "I created this guide to share my knowledge" → ✅ "You'll finally have a clear roadmap for your first product launch"</li>
          <li>❌ "Our templates are professionally designed" → ✅ "Your products will look like they were made by a $5,000 designer"</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Read through your sales page. Count the number of "I/we" vs "you/your." Rewrite until "you" dominates.</p>
        </div>
      </>
    ),
  },
  {
    title: "Tell the Story That Sells the Product",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Use storytelling to create emotional connection and make your product memorable.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Stories Outsell Bullet Points</h2>
        <p>People don't buy products — they buy the transformation. And the best way to communicate transformation is through story.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">The Sales Story Framework</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>The Problem:</strong> "You've been trying to launch for months..."</li>
          <li><strong>The Struggle:</strong> "Every time you sit down to create, you feel overwhelmed..."</li>
          <li><strong>The Discovery:</strong> "That's when I realized there was a better way..."</li>
          <li><strong>The Solution:</strong> "This system gives you everything ready-made..."</li>
          <li><strong>The Result:</strong> "Now you can launch in days, not months..."</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Write a short sales story for your product using the framework above. Add it to your sales page.</p>
        </div>
      </>
    ),
  },
  {
    title: "How to Format Copy People Actually Read",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Structure your copy for maximum readability and engagement.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">People Scan, They Don't Read</h2>
        <p>Online, people scan first and read second. Your copy needs to work for scanners AND readers.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Formatting Rules</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Short paragraphs</strong> — 2-3 sentences max</li>
          <li><strong>Bold key phrases</strong> — So scanners catch the important bits</li>
          <li><strong>Bullet points</strong> — For lists and features</li>
          <li><strong>Subheadings</strong> — Break content into skimmable sections</li>
          <li><strong>White space</strong> — Don't crowd your text</li>
          <li><strong>One idea per paragraph</strong> — Keep it focused</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Review your sales page formatting. Break up any paragraphs longer than 3 sentences.</p>
        </div>
      </>
    ),
  },
  {
    title: "The PAS Formula (Problem, Agitation, Solution)",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Master this powerful copywriting framework to write persuasive copy faster.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">The Most Reliable Copy Framework</h2>
        <p>PAS works for emails, ads, sales pages, and social posts. It's simple, effective, and endlessly reusable.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">How PAS Works</h2>
        <ol className="list-decimal pl-6 space-y-4">
          <li><strong>Problem:</strong> Identify the pain point<p className="text-muted-foreground mt-1">"You've been trying to grow your online business for months but nothing seems to work."</p></li>
          <li><strong>Agitation:</strong> Make it feel urgent<p className="text-muted-foreground mt-1">"Every day you wait is another day your competitors are getting ahead. The frustration builds, the doubt creeps in, and you start wondering if this is even possible for you."</p></li>
          <li><strong>Solution:</strong> Present your product<p className="text-muted-foreground mt-1">"That's exactly why we created [Product Name] — a complete system that takes you from stuck to selling in 7 days."</p></li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Write a PAS paragraph for your main product. Use it as your email subject line + opening paragraph.</p>
        </div>
      </>
    ),
  },
  {
    title: "Write Like You Talk — Not Like a Textbook",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Develop a conversational writing style that builds trust and feels authentic.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Conversational Wins</h2>
        <p>The best-selling copy sounds like a smart friend giving advice — not a professor lecturing. Conversational copy builds trust because it feels real.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Tips for Conversational Copy</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Use contractions (you're, they'll, it's)</li>
          <li>Start sentences with "And," "But," "So"</li>
          <li>Ask questions in your copy</li>
          <li>Use simple words over complex ones</li>
          <li>Read it aloud — if it sounds stiff, rewrite it</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Read your sales page out loud. Rewrite anything that sounds unnatural.</p>
        </div>
      </>
    ),
  },
  {
    title: "Avoid Copy That Tries Too Hard",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Learn to recognize and avoid common copywriting mistakes that undermine credibility.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Red Flags in Copy</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Excessive hype:</strong> "INSANE! MIND-BLOWING! GAME-CHANGER!"</li>
          <li><strong>Fake scarcity:</strong> "Only 3 left!" (for a digital product)</li>
          <li><strong>Unrealistic claims:</strong> "Make $10K in your first week!"</li>
          <li><strong>Manipulation:</strong> Guilt-tripping or shaming non-buyers</li>
          <li><strong>Too many exclamation marks!!!</strong></li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎯</span>
          <p className="text-muted-foreground"><strong>The Fix:</strong> Replace hype with specificity. Instead of "amazing results," say "saved an average of 12 hours per week."</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Audit your copy for hype. Replace every vague claim with a specific, believable one.</p>
        </div>
      </>
    ),
  },
  {
    title: "Social Proof & Testimonials That Actually Convert",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Use testimonials and social proof strategically to build trust and drive conversions.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">People Trust People</h2>
        <p>Social proof is the most powerful conversion tool. When potential buyers see others succeeding with your product, their confidence skyrockets.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Types of Social Proof</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Customer testimonials</strong> — Specific results and experiences</li>
          <li><strong>Numbers</strong> — "10,000+ downloads" or "500+ happy customers"</li>
          <li><strong>Screenshots</strong> — DMs, reviews, or comments praising your product</li>
          <li><strong>Case studies</strong> — Detailed before/after stories</li>
          <li><strong>Trust badges</strong> — Money-back guarantee, secure checkout</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Getting Testimonials Early</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Give your product to 5-10 people for free in exchange for honest feedback</li>
          <li>Ask buyers a specific question: "What result did you get?"</li>
          <li>Screenshot positive DMs and comments (with permission)</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Collect at least 3 testimonials this week. Add them to your product page.</p>
        </div>
      </>
    ),
  },
  {
    title: "Your Landing Page Is the Sales Conversation",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Structure landing pages that guide visitors from curiosity to purchase.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">The Landing Page Blueprint</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Hero Section</strong> — Headline + subheadline + CTA</li>
          <li><strong>Problem Section</strong> — Address the pain point</li>
          <li><strong>Solution Section</strong> — Introduce your product</li>
          <li><strong>What's Included</strong> — Detail every component</li>
          <li><strong>Social Proof</strong> — Testimonials and numbers</li>
          <li><strong>Pricing Section</strong> — Clear offer with CTA</li>
          <li><strong>FAQ</strong> — Handle objections</li>
          <li><strong>Final CTA</strong> — One last push</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Build or revise your landing page following this blueprint. Every section serves a purpose.</p>
        </div>
      </>
    ),
  },
  {
    title: "Buttons, Headlines & CTAs That Drive Action",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Write compelling calls-to-action and headlines that command attention and clicks.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Headlines That Hook</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Be specific:</strong> "How to Launch Your First Product in 48 Hours"</li>
          <li><strong>Promise a benefit:</strong> "Save 20 Hours Every Week on Content"</li>
          <li><strong>Create curiosity:</strong> "The One Mistake Killing Your Product Sales"</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">CTAs That Convert</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>✅ "Get Instant Access" → Better than "Buy Now"</li>
          <li>✅ "Start Your Free Trial" → Better than "Sign Up"</li>
          <li>✅ "Download Your Copy" → Better than "Submit"</li>
          <li>✅ "Yes, I Want This!" → Better than "Purchase"</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Update all your button text and headlines using the formulas above.</p>
        </div>
      </>
    ),
  },
  {
    title: "Email & DMs: Writing Messages That Lead to Sales",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Craft emails and direct messages that build relationships and generate revenue.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Email Is Where Sales Happen</h2>
        <p>Social media gets attention. Email closes sales. Your email list is your most valuable business asset.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Email Copy Best Practices</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Subject line:</strong> Curiosity + benefit (keep under 50 characters)</li>
          <li><strong>Opening line:</strong> Hook them immediately — no "Hope this finds you well"</li>
          <li><strong>Body:</strong> One idea per email, conversational tone</li>
          <li><strong>CTA:</strong> One clear action — don't give 5 different links</li>
          <li><strong>P.S.:</strong> Restate the offer — many people skip to the P.S.</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Write a 3-email sales sequence for your main product. Schedule them to go out over 3 days.</p>
        </div>
      </>
    ),
  },
  {
    title: "Clarity Is the New Creativity",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Understand why clear, simple copy outperforms clever wordplay every time.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Don't Be Clever. Be Clear.</h2>
        <p>Clever copy wins awards. Clear copy wins customers. If your reader has to think about what you mean, you've lost them.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">The Clarity Test</h2>
        <p>For every line of copy, ask:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Would a 12-year-old understand this?</li>
          <li>Is there a simpler way to say this?</li>
          <li>Does this add value or is it filler?</li>
          <li>Would I say this to a friend over coffee?</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Run your entire sales page through the clarity test. Simplify everything that feels complex.</p>
        </div>
      </>
    ),
  },
  {
    title: "Copy Polish Checklist",
    readTime: "3 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">A final checklist to polish your copy before publishing and ensure maximum impact.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Your Copy Quality Checklist</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3"><span>☐</span><span>Headline clearly states the main benefit</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Copy uses "you" more than "I/we"</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Features are translated into benefits</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>There's a clear story or narrative</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Social proof is included (testimonials, numbers)</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>CTA is action-oriented and clear</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Copy is conversational, not formal</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>No hype, fake scarcity, or unrealistic claims</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Formatting is scannable (short paragraphs, bullets, bold)</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Objections are addressed in FAQ</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Read it aloud — sounds natural</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Proofread for typos and grammar</span></li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎉</span>
          <p className="text-muted-foreground"><strong>Congratulations!</strong> You've completed "How to Write Effective Copy in the Age of AI." Your words are now your most powerful sales tool. Go polish and publish.</p>
        </div>
      </>
    ),
  },
];
