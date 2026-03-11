export interface LessonContent {
  title: string;
  readTime?: string;
  content: React.ReactNode;
}

export const COURSE_3_LESSONS: LessonContent[] = [
  {
    title: "Why Funnels Matter for Selling Digital Products",
    readTime: "6 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Understand why funnels are essential for converting browsers into buyers.
        </p>
        <h2 className="text-2xl font-bold text-foreground mt-8">What Is a Funnel?</h2>
        <p>A funnel is simply the journey someone takes from discovering you to buying from you. It's the system that turns strangers into customers — automatically.</p>
        <p>Without a funnel, you're relying on luck. With a funnel, you're building a predictable, repeatable sales machine.</p>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💡</span>
          <p className="text-muted-foreground"><strong>Think of it this way:</strong> A social media post gets attention. A funnel converts that attention into revenue.</p>
        </div>
        <h2 className="text-2xl font-bold text-foreground mt-10">Why Most People Fail Without Funnels</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>They post a product link and hope people buy</li>
          <li>They have no follow-up system for interested visitors</li>
          <li>They lose 95%+ of potential customers who weren't ready to buy immediately</li>
          <li>They have no way to nurture leads over time</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">The Funnel Advantage</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Automated selling</strong> — Works while you sleep</li>
          <li><strong>Higher conversion rates</strong> — Nurtures cold leads into warm buyers</li>
          <li><strong>Predictable revenue</strong> — Know your numbers and scale with confidence</li>
          <li><strong>Customer journey control</strong> — Guide people step by step to purchase</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Map out how customers currently find and buy from you. Identify the gaps where people drop off.</p>
        </div>
      </>
    ),
  },
  {
    title: "Think in Systems, Not Just Sales Pages",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Learn how to build interconnected systems that nurture leads and drive consistent sales.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">The System Mindset</h2>
        <p>A sales page is one piece of the puzzle. A system connects traffic → capture → nurture → sell → upsell into one seamless flow.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Components of a Selling System</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Traffic Source</strong> — Where people discover you (social, SEO, ads)</li>
          <li><strong>Lead Capture</strong> — How you collect their email (opt-in page, lead magnet)</li>
          <li><strong>Nurture Sequence</strong> — Emails that build trust and demonstrate value</li>
          <li><strong>Sales Page</strong> — Where the purchase happens</li>
          <li><strong>Upsell/Cross-sell</strong> — Additional offers after the initial purchase</li>
          <li><strong>Follow-up</strong> — Post-purchase emails, onboarding, and retention</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🔄</span>
          <p className="text-muted-foreground"><strong>Key Insight:</strong> Each component feeds the next. Improve one piece, and the entire system gets better.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Draw out your ideal customer journey from discovery to purchase. Identify which components you need to build first.</p>
        </div>
      </>
    ),
  },
  {
    title: "Lead Magnet Funnel",
    readTime: "6 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Build email lists with irresistible free offers that attract your ideal customers.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">The Foundation of Every Business</h2>
        <p>A lead magnet funnel is the most important funnel you'll build. It captures email addresses in exchange for a free resource, building your audience for future sales.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">What Makes a Great Lead Magnet</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Solves one specific problem</strong> — Not everything, just one thing well</li>
          <li><strong>Quick to consume</strong> — Checklists, cheat sheets, templates work best</li>
          <li><strong>Immediately actionable</strong> — They can use it right away</li>
          <li><strong>Related to your paid product</strong> — Naturally leads to the next step</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Lead Magnet Funnel Structure</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Traffic</strong> → Social post, blog, or ad promoting the free resource</li>
          <li><strong>Landing Page</strong> → Simple opt-in page with benefit-driven headline</li>
          <li><strong>Delivery Email</strong> → Instant delivery + brief intro to your brand</li>
          <li><strong>Nurture Sequence</strong> → 3-5 emails building trust and leading to your paid offer</li>
          <li><strong>Sales Email</strong> → Pitch your product with a clear CTA</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💡</span>
          <p className="text-muted-foreground"><strong>Pro Tip:</strong> Use a product from the Master Library as your lead magnet. Customize a checklist or template and offer it for free to build your list.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Choose a lead magnet, set up your landing page, and write your 3-email welcome sequence.</p>
        </div>
      </>
    ),
  },
  {
    title: "Tripwire Funnel",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Convert free subscribers into buyers with low-cost, high-value offers.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">What Is a Tripwire?</h2>
        <p>A tripwire is a low-priced offer ($7-27) designed to convert a free lead into a paying customer. The goal isn't to make profit — it's to change the relationship from "subscriber" to "buyer."</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Why Tripwires Work</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Psychological commitment:</strong> Once someone pays, they're more likely to pay again</li>
          <li><strong>Self-funding ads:</strong> The tripwire revenue covers your advertising cost</li>
          <li><strong>Buyer segmentation:</strong> Identify your most engaged audience members</li>
          <li><strong>Trust building:</strong> Deliver outsized value at a low price to build loyalty</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Tripwire Funnel Structure</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Lead Magnet Opt-in</strong> → Free resource captures the email</li>
          <li><strong>Thank You Page with Tripwire Offer</strong> → "Wait! Get this for just $9"</li>
          <li><strong>Delivery + Upsell Email</strong> → Deliver the product and pitch a higher offer</li>
          <li><strong>Follow-up Sequence</strong> → Nurture toward your main product</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Pick a low-ticket product from the Master Library ($7-15 range). Set it up as your tripwire offer on your thank-you page.</p>
        </div>
      </>
    ),
  },
  {
    title: "Drip Content Funnel",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Nurture leads over time with automated email sequences that build trust and authority.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">The Power of Patience</h2>
        <p>Not every lead is ready to buy immediately. A drip content funnel delivers valuable content over days or weeks, building trust until the prospect is ready to purchase.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Drip Funnel Blueprint</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Day 1:</strong> Welcome email + deliver lead magnet</li>
          <li><strong>Day 2:</strong> Share a quick win or actionable tip</li>
          <li><strong>Day 4:</strong> Tell your story — why you do what you do</li>
          <li><strong>Day 6:</strong> Provide deep value — teach something substantial</li>
          <li><strong>Day 8:</strong> Share social proof or a case study</li>
          <li><strong>Day 10:</strong> Soft pitch — introduce your paid product as the next step</li>
          <li><strong>Day 12:</strong> Direct pitch with urgency or bonus</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">📧</span>
          <p className="text-muted-foreground"><strong>Key Principle:</strong> Each email should provide standalone value. Even if they never buy, they should feel glad they subscribed.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Write your 7-email drip sequence. Set it up in your email marketing tool as an automation.</p>
        </div>
      </>
    ),
  },
  {
    title: "Mini-Course Funnel",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Deliver value through a structured mini-course that positions you as an expert.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Teach to Sell</h2>
        <p>A mini-course funnel delivers 3-5 lessons for free via email, building authority and trust while naturally leading to your paid offering.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Why Mini-Courses Convert</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Demonstrates expertise</strong> — Proves you know your topic</li>
          <li><strong>Creates commitment</strong> — People invest time following along</li>
          <li><strong>Builds anticipation</strong> — Each lesson reveals more value</li>
          <li><strong>Natural upsell</strong> — The paid product is the logical next step</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Structure</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Lesson 1:</strong> The problem and why it matters</li>
          <li><strong>Lesson 2:</strong> The framework or method</li>
          <li><strong>Lesson 3:</strong> A quick win they can implement today</li>
          <li><strong>Lesson 4:</strong> Advanced strategies (partial reveal)</li>
          <li><strong>Lesson 5:</strong> Pitch your paid product as the complete solution</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Outline a 5-day mini-course based on your niche expertise. Use content from the Master Library as supplementary material.</p>
        </div>
      </>
    ),
  },
  {
    title: "Challenge Funnel",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Create momentum and community with time-bound challenges that drive action and sales.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">The Power of Challenges</h2>
        <p>A challenge funnel gives participants a goal to achieve in 3-7 days, creating engagement, community, and urgency that naturally leads to your paid offer.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Challenge Funnel Structure</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Registration Page</strong> — Clear outcome promise ("In 5 days, you'll...")</li>
          <li><strong>Daily Emails</strong> — One action step per day with clear instructions</li>
          <li><strong>Community Element</strong> — Facebook group or Discord for accountability</li>
          <li><strong>Day 5-7 Pitch</strong> — Present your paid product as the "next level"</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🔥</span>
          <p className="text-muted-foreground"><strong>Challenge Ideas:</strong> "5-Day Launch Your First Digital Product Challenge," "7-Day Brand Building Sprint," "3-Day Pricing Mastery Challenge"</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Design a 5-day challenge for your niche. Outline daily tasks and the pitch for day 5.</p>
        </div>
      </>
    ),
  },
  {
    title: "Quiz Funnel",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Use interactive quizzes to segment your audience and deliver personalized product recommendations.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Why Quizzes Work</h2>
        <p>People love quizzes. They're interactive, personalized, and provide instant gratification. A quiz funnel captures leads while segmenting them into buyer categories — so you can pitch the right product to the right person.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Quiz Funnel Structure</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Quiz Page</strong> — 5-10 questions that assess needs or preferences</li>
          <li><strong>Results Page</strong> — Personalized results with email capture</li>
          <li><strong>Product Recommendation</strong> — Suggest the product that matches their result</li>
          <li><strong>Follow-up Emails</strong> — Personalized nurture based on quiz answers</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">📊</span>
          <p className="text-muted-foreground"><strong>Tools:</strong> Use Typeform, Interact, or ScoreApp to build your quiz. Most integrate directly with email platforms.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Create a quiz with 5 questions that segments your audience into 2-3 product categories.</p>
        </div>
      </>
    ),
  },
  {
    title: "Evergreen Video Funnel",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Leverage automated video sales presentations that convert viewers into customers 24/7.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Selling on Autopilot</h2>
        <p>An evergreen video funnel uses a pre-recorded video (webinar, training, or demo) to sell your product automatically. No live events needed — it runs 24/7.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Evergreen Video Funnel Structure</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Registration Page</strong> — Sign up to watch the free training</li>
          <li><strong>Video Page</strong> — 20-45 minute value-packed training with a pitch at the end</li>
          <li><strong>Sales Page</strong> — Detailed product page for those ready to buy</li>
          <li><strong>Follow-up Emails</strong> — For those who didn't buy immediately (replay + urgency)</li>
        </ol>
        <h2 className="text-2xl font-bold text-foreground mt-10">Video Content Framework</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Minutes 1-5:</strong> Hook and promise</li>
          <li><strong>Minutes 5-15:</strong> Teach valuable content (3 key points)</li>
          <li><strong>Minutes 15-25:</strong> Show proof and results</li>
          <li><strong>Minutes 25-35:</strong> Present your offer</li>
          <li><strong>Minutes 35-45:</strong> Q&A and urgency</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Script a 30-minute training video for your niche. Record it and set up the funnel pages.</p>
        </div>
      </>
    ),
  },
  {
    title: "Content Upgrade Funnel",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Turn blog readers into subscribers with content-specific upgrades that add immediate value.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">What Is a Content Upgrade?</h2>
        <p>A content upgrade is a bonus resource that enhances a specific piece of content. Instead of a generic lead magnet, you offer something directly related to what the reader is already consuming.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Examples</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Blog post about pricing → <strong>Free Pricing Calculator Template</strong></li>
          <li>Video about Instagram growth → <strong>30 Viral Hook Templates PDF</strong></li>
          <li>Podcast about productivity → <strong>Weekly Planning Worksheet</strong></li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">📈</span>
          <p className="text-muted-foreground"><strong>Conversion Rates:</strong> Generic lead magnets convert at 1-3%. Content upgrades convert at 5-15%. The specificity makes all the difference.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Pick your top 3 pieces of content and create a relevant content upgrade for each using Master Library resources.</p>
        </div>
      </>
    ),
  },
  {
    title: "Referral Funnel",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Turn customers into advocates with incentivized referral programs that drive organic growth.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Your Customers Are Your Best Marketers</h2>
        <p>Referral funnels leverage your happiest customers to bring in new buyers. Word-of-mouth is the most trusted form of marketing — a referral funnel systematizes it.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Referral Funnel Structure</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Post-purchase email</strong> — Thank them and introduce the referral program</li>
          <li><strong>Unique referral link</strong> — Easy to share on social or with friends</li>
          <li><strong>Incentive</strong> — Reward for each referral (discount, free product, exclusive content)</li>
          <li><strong>Tracking</strong> — Dashboard or email updates showing referral progress</li>
        </ol>
        <h2 className="text-2xl font-bold text-foreground mt-10">Incentive Ideas</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>1 referral = exclusive bonus template</li>
          <li>3 referrals = free product from your catalog</li>
          <li>5 referrals = access to a premium bundle</li>
          <li>10 referrals = lifetime VIP access</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Set up a simple referral program. Write the post-purchase email and define your referral incentives.</p>
        </div>
      </>
    ),
  },
  {
    title: "Interactive Tool Funnel",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Attract leads with free calculators, generators, or tools that showcase your expertise.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Tools as Lead Magnets</h2>
        <p>Free tools (calculators, generators, assessments) are powerful lead magnets because they provide immediate, personalized value. Users get results, you get their email.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Tool Ideas by Niche</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Finance:</strong> Savings calculator, investment estimator</li>
          <li><strong>Marketing:</strong> Headline generator, content calendar builder</li>
          <li><strong>Business:</strong> Pricing calculator, revenue forecaster</li>
          <li><strong>Health:</strong> Calorie calculator, workout planner</li>
          <li><strong>Design:</strong> Color palette generator, font pairing tool</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Funnel Structure</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Free tool page</strong> — User interacts and gets results</li>
          <li><strong>Email gate</strong> — "Get your full results emailed to you"</li>
          <li><strong>Results email</strong> — Detailed results + product recommendation</li>
          <li><strong>Follow-up</strong> — Nurture sequence toward paid product</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Brainstorm 3 free tools you could create for your audience. Pick the simplest one and plan its implementation.</p>
        </div>
      </>
    ),
  },
  {
    title: "Choose the Right Funnel for Your Business Stage",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Match funnel strategies to your business goals and current stage of growth.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Not All Funnels Are Created Equal</h2>
        <p>The best funnel depends on where you are in your business journey. Don't try to build a complex webinar funnel when you haven't validated your product yet.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Funnel by Stage</h2>
        <div className="space-y-6 mt-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">🌱 Just Starting (0-100 subscribers)</h3>
            <p className="text-muted-foreground mt-2">Start with: <strong>Lead Magnet Funnel + Tripwire</strong></p>
            <p className="text-muted-foreground">Focus on building your list and making your first sales.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">🌿 Growing (100-1,000 subscribers)</h3>
            <p className="text-muted-foreground mt-2">Add: <strong>Drip Content + Content Upgrade Funnels</strong></p>
            <p className="text-muted-foreground">Nurture your audience and increase conversion rates.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-lg font-bold text-foreground">🌳 Scaling (1,000+ subscribers)</h3>
            <p className="text-muted-foreground mt-2">Add: <strong>Evergreen Video + Quiz + Referral Funnels</strong></p>
            <p className="text-muted-foreground">Automate, segment, and leverage word-of-mouth.</p>
          </div>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Identify your current stage. Choose the recommended funnel type and commit to building it this week.</p>
        </div>
      </>
    ),
  },
  {
    title: "Launch Your First Funnel and Let It Work",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Take action with confidence and launch your first funnel to start generating consistent sales.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Done Is Better Than Perfect</h2>
        <p>Your first funnel won't be perfect — and that's okay. The goal is to get it live, start collecting data, and improve over time. A live imperfect funnel beats a perfect funnel that never launches.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Your Launch Checklist</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3"><span>☐</span><span>Lead magnet created and hosted</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Landing page live with email capture</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Welcome/delivery email set up</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Nurture sequence written (3-5 emails minimum)</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Sales page for paid product ready</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Payment processing connected</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Test the entire flow yourself</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Promote your lead magnet on social media</span></li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Metrics to Track</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Opt-in rate:</strong> % of visitors who subscribe (aim for 20%+)</li>
          <li><strong>Email open rate:</strong> % who open your emails (aim for 30%+)</li>
          <li><strong>Click rate:</strong> % who click links in your emails (aim for 3%+)</li>
          <li><strong>Conversion rate:</strong> % who buy your product (aim for 1-3%)</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🚀</span>
          <p className="text-muted-foreground"><strong>Congratulations!</strong> You now have the knowledge to build any funnel type. Pick one, build it, launch it. Your first funnel is the beginning of automated revenue.</p>
        </div>
      </>
    ),
  },
];
