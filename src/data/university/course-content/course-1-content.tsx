import creationTrapCycleImg from "@/assets/university/creation-trap-cycle.png";
import editablePlrImg from "@/assets/university/editable-plr-products.jpg";

export interface LessonContent {
  title: string;
  readTime?: string;
  content: React.ReactNode;
}

export const COURSE_1_LESSONS: LessonContent[] = [
  {
    title: "Private Label Rights Explained",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Stop creating from scratch. Start launching what's already built for you.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">The Content Creation Trap</h2>
        <p>Here's a pattern that kills most digital businesses before they even start:</p>
        <p>
          You decide to sell a digital product. An ebook, a course, a template pack. So you sit
          down to create it. You research. You write. You design. You second-guess. You
          redesign. You rewrite. Weeks pass. Months pass. The product still isn't "ready."
          Meanwhile, you haven't made a single sale, built an audience, or tested whether
          anyone even wants what you're making.
        </p>
        <p>This is the content creation trap, and it's the #1 reason people never launch.</p>
        <p>
          The math is brutal: a single quality ebook takes 80-200 hours to create from scratch. A
          video course? Even more. And that's <em>one</em> product. To build a real business, you need
          multiple products, lead magnets, email sequences, social content, all of it.
        </p>

        <div className="my-8 flex justify-center">
          <img src={creationTrapCycleImg} alt="The Creation Trap Cycle" className="max-w-md w-full" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">The Shift: Creator → Curator</h2>
        <p>
          The solution isn't to work harder or faster at creating. It's to stop creating from scratch entirely.
        </p>
        <p>
          Think about it this way: the most successful digital businesses aren't built by people
          who make everything themselves. They're built by people who are great at{" "}
          <strong>finding, customizing, and positioning</strong> products for the right audience.
        </p>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💡</span>
          <p className="text-muted-foreground">
            A creator says: "I need to build this from nothing." A curator says: "I have 1,000+
            ready-made products. Which one does my audience need most?"
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">What "Ready-to-Brand" Actually Means</h2>
        <p>Every product in the Master Library is:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Professionally designed</strong> – clean, modern layouts you'd be proud to sell</li>
          <li><strong>Expertly written</strong> – real content with depth, not AI filler or recycled fluff</li>
          <li><strong>Fully editable</strong> – delivered in Canva, Google Docs, and DOCX formats</li>
          <li><strong>Commercially licensed</strong> – brand it, customize it, and sell it as your own</li>
        </ul>

        <div className="my-8 flex justify-center">
          <img src={editablePlrImg} alt="Editable PLR Products" className="w-full rounded-lg" />
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">What You Can (and Can't) Do</h2>
        <h3 className="text-lg font-bold text-foreground mt-6">✅ You can:</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Rebrand and sell</strong> any product as your own</li>
          <li><strong>Edit everything</strong> – change text, swap designs, add links</li>
          <li><strong>Use them anywhere</strong> – website, social media, email list, paid offers</li>
          <li><strong>Bundle products</strong> together to create higher-value offers</li>
          <li><strong>Give products away</strong> as lead magnets or bonuses</li>
        </ul>
        <h3 className="text-lg font-bold text-foreground mt-6">❌ You cannot:</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Resell the entire Master Library</strong> as a collection</li>
          <li><strong>Pass along resell rights</strong> – your customers can't resell to others</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-10">What's Ahead</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Start Your Online Business</strong> – Navigate the library and pick the right product</li>
          <li><strong>Building Your Product Offering</strong> – Customize, brand, and polish it</li>
          <li><strong>Branding and Customization</strong> – Make it truly yours</li>
          <li><strong>Marketing Your Business</strong> – Get your first sales</li>
        </ol>
        <p className="mt-6">Let's start by finding your first product.</p>
      </>
    ),
  },
  {
    title: "Start Your Online Business",
    readTime: "6 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Every successful online business starts with a single decision — to begin.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">The Reality of Starting Online</h2>
        <p>
          Starting an online business doesn't require a huge budget, a team, or years of experience.
          What it requires is clarity, a product, and the willingness to put it in front of people.
        </p>
        <p>
          Most people overcomplicate this step. They think they need a perfect website, a massive following,
          or a revolutionary idea. The truth? You need one product and one customer to get started.
        </p>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎯</span>
          <p className="text-muted-foreground">
            <strong>Key Insight:</strong> The gap between "thinking about starting" and "actually starting" isn't knowledge — it's action.
            You already have everything you need.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">Choose Your Starting Point</h2>
        <p>There are three paths to launching your first digital product:</p>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong>The Quick Launch</strong> — Pick a product from the Master Library, add your branding,
            and list it for sale within 24 hours. Perfect for testing demand.
          </li>
          <li>
            <strong>The Niche Build</strong> — Research your audience first, then select products that
            solve their specific problems. Takes a few days but builds stronger foundations.
          </li>
          <li>
            <strong>The Bundle Strategy</strong> — Combine 3-5 related products into a premium package.
            Higher perceived value, higher price point.
          </li>
        </ol>

        <h2 className="text-2xl font-bold text-foreground mt-10">Your First 48 Hours</h2>
        <p>Here's exactly what to do in your first two days:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Hour 1-2:</strong> Browse the library and shortlist 5 products you connect with</li>
          <li><strong>Hour 3-4:</strong> Pick your top choice and customize it with your branding</li>
          <li><strong>Hour 5-6:</strong> Set up your selling platform (we'll cover options later)</li>
          <li><strong>Hour 7-8:</strong> Write your product description and set your price</li>
          <li><strong>Day 2:</strong> Share it with at least 10 people and ask for feedback</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-10">Common Mistakes to Avoid</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Perfectionism:</strong> Your first product doesn't need to be perfect — it needs to exist</li>
          <li><strong>Analysis paralysis:</strong> Don't spend weeks choosing — pick one and go</li>
          <li><strong>Skipping the audience:</strong> Always think about who will buy this and why</li>
          <li><strong>Ignoring pricing:</strong> Don't underprice out of fear — we'll cover pricing strategy later</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground">
            <strong>Action Step:</strong> Open the Master Library right now and bookmark 3 products that align with
            topics you're passionate about or have knowledge in.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Building Your Product Offering",
    readTime: "7 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          A single product gets you started. A product ecosystem builds you a business.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">Think Beyond One Product</h2>
        <p>
          Your first product is your foot in the door. But a real digital business is built on a
          <strong> product ecosystem</strong> — a collection of complementary products that serve your audience
          at different stages of their journey.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">The Product Ladder</h2>
        <p>Think of your offerings as a ladder your customers climb:</p>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Free Lead Magnet</strong> ($0) — A checklist, template, or mini-guide that attracts new leads</li>
          <li><strong>Low-Ticket Product</strong> ($7-27) — An ebook or template pack that converts leads into buyers</li>
          <li><strong>Mid-Ticket Product</strong> ($27-97) — A comprehensive course or bundle that delivers deeper value</li>
          <li><strong>Premium Offering</strong> ($97-497) — A complete system, course bundle, or coaching offer</li>
        </ol>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💡</span>
          <p className="text-muted-foreground">
            <strong>Pro Tip:</strong> You don't need all four levels on day one. Start with a lead magnet and
            one paid product. Add more as you grow.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">Bundling for Higher Value</h2>
        <p>One of the fastest ways to increase your revenue is bundling related products together:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Topic bundles:</strong> Group 3-5 products on the same subject</li>
          <li><strong>Starter kits:</strong> Combine a guide + templates + checklists for beginners</li>
          <li><strong>Pro packs:</strong> Advanced resources for experienced buyers</li>
          <li><strong>Seasonal bundles:</strong> Curate products around trends or time of year</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-10">Matching Products to Your Niche</h2>
        <p>
          The Master Library has products across dozens of topics. Your job is to match products
          to what your audience actually needs. Ask yourself:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>What problems does my audience face daily?</li>
          <li>What skills do they want to learn?</li>
          <li>What tools or templates would save them time?</li>
          <li>What would make them feel more confident in their work?</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground">
            <strong>Action Step:</strong> Map out your product ladder. Pick one free lead magnet and one paid
            product from the library to start with.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Branding and Customization",
    readTime: "8 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          The product is the foundation. Your brand is what makes it unforgettable.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">Why Branding Matters</h2>
        <p>
          Two people can sell the exact same ebook. One makes $50, the other makes $5,000. The difference?
          <strong> Branding.</strong> Your brand is the perception people have of your business — and it starts
          with how your products look, feel, and communicate.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">The 5-Minute Brand Kit</h2>
        <p>You don't need a branding agency. You need five things:</p>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Brand Name</strong> — Something memorable and easy to spell</li>
          <li><strong>Color Palette</strong> — 2-3 primary colors that reflect your vibe</li>
          <li><strong>Font Pair</strong> — One for headings, one for body text</li>
          <li><strong>Logo</strong> — Even a simple text logo works to start</li>
          <li><strong>Brand Voice</strong> — How you "sound" in writing (professional, casual, bold?)</li>
        </ol>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎨</span>
          <p className="text-muted-foreground">
            <strong>Quick Win:</strong> Use Canva's Brand Kit feature to save your colors, fonts, and logos.
            Then apply them to any product in seconds.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">Customizing Master Library Products</h2>
        <p>Here's the customization workflow that takes under an hour:</p>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Open the Canva template</strong> — Every product has an editable Canva link</li>
          <li><strong>Apply your brand colors</strong> — Replace the default palette with yours</li>
          <li><strong>Swap the fonts</strong> — Use your brand fonts for headings and body</li>
          <li><strong>Add your logo</strong> — Place it on the cover and footer</li>
          <li><strong>Edit the content</strong> — Add your voice, examples, and perspective</li>
          <li><strong>Update links</strong> — Add your website, social handles, and affiliate links</li>
          <li><strong>Export</strong> — Download as PDF and you're ready to sell</li>
        </ol>

        <h2 className="text-2xl font-bold text-foreground mt-10">Using AI to Speed Up Customization</h2>
        <p>
          AI tools like ChatGPT can dramatically speed up your customization process:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Rewrite sections</strong> in your brand voice</li>
          <li><strong>Generate new examples</strong> relevant to your niche</li>
          <li><strong>Create social media captions</strong> to promote the product</li>
          <li><strong>Write email sequences</strong> to sell the product to your list</li>
          <li><strong>Brainstorm product names</strong> that resonate with your audience</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground">
            <strong>Action Step:</strong> Create your 5-minute brand kit right now. Pick your colors, fonts, and
            write a one-sentence brand description.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Marketing Your Business",
    readTime: "7 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          The best product in the world means nothing if nobody knows it exists.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">Marketing Without a Big Budget</h2>
        <p>
          You don't need thousands of dollars for ads. You don't need millions of followers. You need
          a strategy that puts your product in front of the right people consistently.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">The 3-Channel Strategy</h2>
        <p>Pick three marketing channels and master them before adding more:</p>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong>Social Media (Pick 1-2 Platforms)</strong>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Instagram for visual products and lifestyle niches</li>
              <li>Twitter/X for business and tech niches</li>
              <li>TikTok for reaching younger audiences quickly</li>
              <li>Pinterest for evergreen traffic to product pages</li>
            </ul>
          </li>
          <li>
            <strong>Email Marketing</strong> — Build a list from day one. It's your most valuable asset.
          </li>
          <li>
            <strong>Content Marketing</strong> — Blog posts, videos, or podcast episodes that attract organic traffic.
          </li>
        </ol>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">📧</span>
          <p className="text-muted-foreground">
            <strong>Critical Rule:</strong> If you do nothing else, build an email list. Social platforms come and go.
            Your email list is yours forever.
          </p>
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">Content Ideas That Sell</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Problem-solution posts:</strong> Show the problem your product solves</li>
          <li><strong>Behind-the-scenes:</strong> Show your customization process</li>
          <li><strong>Customer results:</strong> Share testimonials and success stories</li>
          <li><strong>Quick tips:</strong> Give away valuable tips related to your niche</li>
          <li><strong>Product previews:</strong> Show pages or sections of your product</li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-10">Your First Week Marketing Plan</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Day 1:</strong> Announce your product on your main social platform</li>
          <li><strong>Day 2:</strong> Share a valuable tip related to your product's topic</li>
          <li><strong>Day 3:</strong> Post a product preview (mockup or inside look)</li>
          <li><strong>Day 4:</strong> Share your "why" — why you created this product</li>
          <li><strong>Day 5:</strong> Offer a limited-time discount or bonus</li>
          <li><strong>Day 6:</strong> Share a testimonial or early feedback</li>
          <li><strong>Day 7:</strong> Recap the week and share a direct link to buy</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground">
            <strong>Action Step:</strong> Pick your 3 marketing channels and write your first product announcement post.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Scaling and Diversifying",
    readTime: "6 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Once you've made your first sale, it's time to think bigger.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">From First Sale to Real Business</h2>
        <p>
          Your first sale proves the concept works. Now it's time to build systems that multiply
          your efforts. Scaling isn't about working 10x harder — it's about making what already works
          reach more people.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">5 Ways to Scale</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Add more products</strong> — Use the library to launch a new product every week</li>
          <li><strong>Create bundles</strong> — Package related products for higher price points</li>
          <li><strong>Build email funnels</strong> — Automate your sales with email sequences</li>
          <li><strong>Run paid ads</strong> — Once you know what converts, amplify with ads</li>
          <li><strong>Collaborate</strong> — Partner with others in your niche for cross-promotion</li>
        </ol>

        <h2 className="text-2xl font-bold text-foreground mt-10">Diversifying Your Income</h2>
        <p>Don't rely on a single product or platform. Build multiple revenue streams:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Direct sales</strong> on your own website</li>
          <li><strong>Marketplace sales</strong> on platforms like Gumroad, Etsy, or Stan</li>
          <li><strong>Affiliate income</strong> by embedding affiliate links in your products</li>
          <li><strong>Lead magnets</strong> that funnel into coaching or consulting</li>
          <li><strong>Subscription offers</strong> with monthly content deliveries</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">📈</span>
          <p className="text-muted-foreground">
            <strong>Growth Formula:</strong> More products × More channels × Better conversion = Exponential growth.
            Focus on improving one variable at a time.
          </p>
        </div>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground">
            <strong>Action Step:</strong> Plan your next 3 product launches. Pick products from the library,
            set target dates, and create a simple launch calendar.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Key Takeaways and Next Steps",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          You've learned the system. Now it's time to execute.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">What We've Covered</h2>
        <p>Let's recap the key lessons from this course:</p>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>The Curator Mindset</strong> — Stop creating from scratch, start curating and customizing</li>
          <li><strong>Starting Your Business</strong> — You don't need perfection, you need action</li>
          <li><strong>Product Offerings</strong> — Build a product ladder, not just a single product</li>
          <li><strong>Branding</strong> — Your brand is what makes generic products uniquely yours</li>
          <li><strong>Marketing</strong> — Consistency on 3 channels beats sporadic presence everywhere</li>
          <li><strong>Scaling</strong> — Multiply what works, diversify for stability</li>
        </ol>

        <h2 className="text-2xl font-bold text-foreground mt-10">Your 30-Day Action Plan</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Week 1:</strong> Pick your niche, create your brand kit, customize your first product</li>
          <li><strong>Week 2:</strong> Set up your selling platform and list your first product</li>
          <li><strong>Week 3:</strong> Start your marketing — social posts, email list, content</li>
          <li><strong>Week 4:</strong> Launch your second product, analyze what's working, optimize</li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🚀</span>
          <p className="text-muted-foreground">
            <strong>Remember:</strong> The difference between people who succeed and people who don't isn't talent or luck — it's execution.
            You have the products, the knowledge, and the tools. Now go build.
          </p>
        </div>
      </>
    ),
  },
  {
    title: "Visionaire's Library Checklist",
    readTime: "3 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">
          Your step-by-step checklist to go from access to income.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-8">Getting Started Checklist</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Browse the Master Library and explore all product categories</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Choose your niche and target audience</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Select your first product to customize</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Create your Brand Kit (name, colors, fonts, logo)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Customize your first product with your branding</span>
          </li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-10">Launch Checklist</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Set up your selling platform (Gumroad, Stan, or your website)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Write compelling product descriptions</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Create product mockups for marketing</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Set your pricing strategy</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Publish your first product listing</span>
          </li>
        </ul>

        <h2 className="text-2xl font-bold text-foreground mt-10">Growth Checklist</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Set up email marketing (lead magnet + welcome sequence)</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Create a content calendar for social media</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Launch your second product</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Create your first product bundle</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-lg">☐</span>
            <span>Analyze results and optimize your bestsellers</span>
          </li>
        </ul>

        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎉</span>
          <p className="text-muted-foreground">
            <strong>Congratulations!</strong> You've completed the "How to Use Master Library" course.
            Continue to the next courses to master online business, funnels, platforms, pricing, copywriting, and design.
          </p>
        </div>
      </>
    ),
  },
];
