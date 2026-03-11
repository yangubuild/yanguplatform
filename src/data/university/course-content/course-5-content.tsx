export interface LessonContent {
  title: string;
  readTime?: string;
  content: React.ReactNode;
}

export const COURSE_5_LESSONS: LessonContent[] = [
  {
    title: "Why Pricing Matters More Than You Think",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Understand why pricing shapes perception, trust, and business sustainability.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Price Is a Signal</h2>
        <p>Your price isn't just a number — it's a message. It tells your customer what to expect in terms of quality, value, and professionalism. Price too low, and people assume it's low quality. Price too high without justification, and they walk away.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Common Pricing Mistakes</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Racing to the bottom</strong> — Competing on price alone destroys margins</li>
          <li><strong>Copying competitors blindly</strong> — Their costs and value proposition differ from yours</li>
          <li><strong>Pricing based on effort</strong> — Customers pay for results, not hours</li>
          <li><strong>Never changing prices</strong> — Your prices should evolve with your business</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💡</span>
          <p className="text-muted-foreground"><strong>Truth:</strong> Most digital product creators underprice by 50-300%. If you're nervous about your price, it's probably too low.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Write down what you think your product is worth. Then double it. That's probably closer to the right price.</p>
        </div>
      </>
    ),
  },
  {
    title: "The Psychology of Pricing",
    readTime: "6 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Learn how buyers think and make decisions based on price points and perceived value.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">How Buyers Process Price</h2>
        <p>Pricing decisions aren't rational — they're emotional. Understanding buyer psychology helps you price in ways that feel right to your customers.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Key Pricing Psychology Principles</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Anchoring</strong> — The first number someone sees becomes their reference point. Show the "full value" before your price.</li>
          <li><strong>Charm Pricing</strong> — $27 feels cheaper than $30, even though it's only $3 less.</li>
          <li><strong>Decoy Effect</strong> — Adding a third option makes the middle option look like the best deal.</li>
          <li><strong>Loss Aversion</strong> — People fear losing more than they desire gaining. Frame your offer as what they'll miss without it.</li>
          <li><strong>Social Proof</strong> — "10,000 customers" makes any price feel justified.</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🧠</span>
          <p className="text-muted-foreground"><strong>Example:</strong> "Total Value: $197. Your Price Today: $27." — Anchoring makes $27 feel like a steal, even if the "$197 value" is subjective.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Apply at least 2 psychology principles to your current product pricing page.</p>
        </div>
      </>
    ),
  },
  {
    title: "Understand Your Product's Value",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Discover how to identify and communicate the true value your digital product delivers.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Value Is What They Get, Not What You Made</h2>
        <p>Your product's value isn't measured by how long it took to create. It's measured by the outcome it delivers. A 2-page checklist that saves someone 10 hours is worth more than a 200-page ebook they'll never finish.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Types of Value</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Time saved</strong> — How many hours does your product save?</li>
          <li><strong>Money earned</strong> — Will your product help them make money?</li>
          <li><strong>Problems solved</strong> — What pain point does it eliminate?</li>
          <li><strong>Skills gained</strong> — What can they do after using your product?</li>
          <li><strong>Confidence built</strong> — How does your product make them feel?</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💰</span>
          <p className="text-muted-foreground"><strong>Value Formula:</strong> If your product helps someone earn an extra $500/month, charging $47 for it is a no-brainer investment for them.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> List 5 specific outcomes your product delivers. Use these in your sales copy.</p>
        </div>
      </>
    ),
  },
  {
    title: "Flat Pricing vs Tiered Pricing",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Compare pricing models and learn which one fits your product and audience best.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">One Price or Multiple Options?</h2>
        <h2 className="text-2xl font-bold text-foreground mt-10">Flat Pricing</h2>
        <p>One product, one price. Simple and effective.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>✅ Easy for customers to understand</li>
          <li>✅ No decision fatigue</li>
          <li>❌ Leaves money on the table from premium buyers</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Tiered Pricing</h2>
        <p>Multiple options at different price points (Basic / Pro / Premium).</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>✅ Captures different buyer segments</li>
          <li>✅ The middle tier usually gets the most sales (decoy effect)</li>
          <li>✅ Higher average order value</li>
          <li>❌ More complex to set up</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💡</span>
          <p className="text-muted-foreground"><strong>Recommendation:</strong> Start with flat pricing for your first product. Once you have sales data, experiment with tiers.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> If using tiers, define what's included in each tier. Make the middle tier the obvious best value.</p>
        </div>
      </>
    ),
  },
  {
    title: "One-Time vs Subscription Pricing",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Understand the pros and cons of one-time purchases versus recurring subscription models.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Revenue Models Compared</h2>
        <h2 className="text-2xl font-bold text-foreground mt-10">One-Time Pricing</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>✅ Simple to understand and sell</li>
          <li>✅ Higher upfront revenue per sale</li>
          <li>✅ No churn concerns</li>
          <li>❌ Need constant new customers for revenue</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Subscription Pricing</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>✅ Predictable recurring revenue</li>
          <li>✅ Higher lifetime customer value</li>
          <li>✅ Builds loyal community</li>
          <li>❌ Need to continually deliver value to prevent churn</li>
          <li>❌ Lower initial revenue per customer</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💡</span>
          <p className="text-muted-foreground"><strong>Hybrid Approach:</strong> Sell products one-time AND offer a subscription for ongoing access to new products, updates, and community.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Decide which model fits your current stage. Most beginners should start with one-time pricing.</p>
        </div>
      </>
    ),
  },
  {
    title: '"Pay What You Want" and Free + Upsell Strategy',
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Explore alternative pricing strategies that build trust and create opportunities for upsells.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Non-Traditional Pricing Models</h2>
        <h2 className="text-2xl font-bold text-foreground mt-10">Pay What You Want (PWYW)</h2>
        <p>Let customers choose their price. Works best when you have an established audience and strong social proof.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>✅ Removes price barrier for hesitant buyers</li>
          <li>✅ Some customers pay MORE than you'd have charged</li>
          <li>❌ Many will pay the minimum (often $0)</li>
          <li>💡 Set a minimum price ($1-5) to filter serious buyers</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Free + Upsell</h2>
        <p>Give a product away for free, then upsell a premium version or related product.</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>✅ Builds massive email lists fast</li>
          <li>✅ Demonstrates value before asking for money</li>
          <li>✅ Creates goodwill and trust</li>
          <li>❌ Many free users never convert (that's normal)</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Consider offering one product as a free lead magnet to build your list, then upsell a premium bundle.</p>
        </div>
      </>
    ),
  },
  {
    title: "Look at the Market, But Price for Value",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Learn how to research competitors while staying focused on your unique value proposition.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Competitive Research Done Right</h2>
        <p>Knowing what competitors charge is useful context — but it shouldn't dictate your price. Your product, brand, and audience are unique.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">How to Research</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Search for similar products</strong> on Gumroad, Etsy, and Google</li>
          <li><strong>Note price ranges</strong> — What's the lowest, highest, and average?</li>
          <li><strong>Analyze what's included</strong> — More value justifies higher prices</li>
          <li><strong>Read reviews</strong> — What do buyers value most?</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎯</span>
          <p className="text-muted-foreground"><strong>Rule of Thumb:</strong> Price in the top 30% of your market. Cheap positioning attracts cheap customers. Premium positioning attracts serious buyers.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Research 5 competing products. Note their prices and what's included. Position yours to deliver more value.</p>
        </div>
      </>
    ),
  },
  {
    title: "Test Your Pricing Before Scaling",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Discover practical methods to validate and test your pricing with real customers.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Pricing Is a Hypothesis</h2>
        <p>Your first price is a guess — an educated guess, but still a guess. Testing helps you find the price that maximizes revenue.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Testing Methods</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Launch at a lower price</strong> and increase every 10-20 sales</li>
          <li><strong>A/B test</strong> two different prices on the same product</li>
          <li><strong>Survey your audience</strong> — "Would you pay $X for this?"</li>
          <li><strong>Use launch pricing</strong> — Start low, announce the price will increase</li>
          <li><strong>Monitor conversion rates</strong> — If conversions are high, your price might be too low</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">📊</span>
          <p className="text-muted-foreground"><strong>Key Metric:</strong> If your conversion rate is above 5%, try raising your price. If it's below 1%, your price might be too high (or your copy needs work).</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Launch your product at your best-guess price with "launch pricing" framing. Plan to increase after 25 sales.</p>
        </div>
      </>
    ),
  },
  {
    title: "Turn Products Into Offers",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Learn how to package, position, and present your products as compelling offers that convert.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">The Offer Stack</h2>
        <p>An offer isn't just a product — it's a package of value that makes buying feel like a no-brainer.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Building Your Offer Stack</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Main product</strong> — Your core digital product</li>
          <li><strong>Bonus 1</strong> — A complementary resource (template, checklist)</li>
          <li><strong>Bonus 2</strong> — An exclusive resource (video training, swipe files)</li>
          <li><strong>Bonus 3</strong> — A time-limited extra (1-on-1 audit, community access)</li>
          <li><strong>Guarantee</strong> — 30-day money-back or satisfaction guarantee</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💰</span>
          <p className="text-muted-foreground"><strong>Stack Example:</strong> "Digital Marketing Toolkit ($47) includes: 90-page guide (value $27) + 50 social media templates (value $19) + content calendar (value $15) + private community access (value $29). Total value: $90. Your price: $47."</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Build an offer stack for your main product. Add 2-3 bonuses from the Master Library.</p>
        </div>
      </>
    ),
  },
  {
    title: "Set Your Pricing and Stick to It (at First)",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Understand why consistency matters and when to adjust your pricing strategy.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Stop Second-Guessing</h2>
        <p>Once you've done your research, set your price and commit to it for at least 30 days. Constant price changes confuse customers and undermine trust.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">When to Adjust</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Raise your price</strong> when conversion rates are consistently above 5%</li>
          <li><strong>Raise your price</strong> when you add new value (bonuses, updates)</li>
          <li><strong>Lower your price</strong> only as a strategic promotion, not out of desperation</li>
          <li><strong>Never discount permanently</strong> — use limited-time offers instead</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Set your price, write it down, and commit to not changing it for 30 days. Track your sales and conversion data.</p>
        </div>
      </>
    ),
  },
  {
    title: "Create a Pricing Section or Page That Converts",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Design pricing pages that clearly communicate value and drive purchase decisions.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Your Pricing Page = Your Close</h2>
        <p>The pricing section is where the decision happens. Every element should reduce friction and reinforce value.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Elements of a High-Converting Pricing Section</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Clear product name</strong> that communicates value</li>
          <li><strong>Price with context</strong> — Show total value vs. your price</li>
          <li><strong>What's included</strong> — Bullet list of everything they get</li>
          <li><strong>Social proof</strong> — Testimonials, review count, buyer count</li>
          <li><strong>Guarantee</strong> — Remove risk with clear refund policy</li>
          <li><strong>Strong CTA</strong> — "Get Instant Access" beats "Buy Now"</li>
          <li><strong>FAQ</strong> — Address common objections</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Review your current product page against this checklist. Add any missing elements.</p>
        </div>
      </>
    ),
  },
  {
    title: "Your Final Step: Price With Confidence",
    readTime: "3 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Launch your products with pricing confidence and clarity.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">You're Ready</h2>
        <p>You now understand pricing psychology, value communication, competitive positioning, and testing strategies. You have everything you need to price with confidence.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Your Pricing Checklist</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3"><span>☐</span><span>Identified your product's core value and outcomes</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Researched competitor pricing</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Chosen your pricing model (flat, tiered, or subscription)</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Built an offer stack with bonuses</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Applied pricing psychology (anchoring, charm pricing)</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Created a pricing page with all essential elements</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Set your price and committed to it</span></li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎉</span>
          <p className="text-muted-foreground"><strong>Congratulations!</strong> You've completed "How to Price Digital Products." Go update your product pricing with confidence.</p>
        </div>
      </>
    ),
  },
];
