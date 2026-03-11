export interface LessonContent {
  title: string;
  readTime?: string;
  content: React.ReactNode;
}

export const COURSE_7_LESSONS: LessonContent[] = [
  {
    title: "Introduction",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Begin your journey to creating professional, scroll-stopping visuals for your digital products.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Why This Course Exists</h2>
        <p>In the digital product world, visuals aren't just decoration — they're your first impression, your credibility signal, and often the deciding factor between a sale and a scroll-past.</p>
        <p>This course will teach you how to create stunning visuals even if you have zero design experience. We'll use tools that are accessible, affordable, and powerful.</p>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎨</span>
          <p className="text-muted-foreground"><strong>What You'll Learn:</strong> Color theory, typography, design principles, AI-powered asset creation, mockups, thumbnails, and a complete design workflow.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Take a screenshot of your current product visuals. By the end of this course, you'll compare them to your upgraded versions.</p>
        </div>
      </>
    ),
  },
  {
    title: "Why are visuals important?",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Understand how visuals impact perception, credibility, and conversions.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">First Impressions Are Visual</h2>
        <p>It takes 50 milliseconds for someone to form an opinion about your product. In that time, they see your visual — not your description, not your testimonials, not your price. Your visual is your first and most important sales tool.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">The Visual Impact</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Professional visuals</strong> increase perceived value by 200-300%</li>
          <li><strong>Product mockups</strong> increase conversions by up to 40%</li>
          <li><strong>Consistent branding</strong> across products builds recognition and trust</li>
          <li><strong>High-quality thumbnails</strong> get 2-3x more clicks than generic ones</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💡</span>
          <p className="text-muted-foreground"><strong>Key Insight:</strong> You can charge 2-5x more for the exact same product if the visuals are premium. Design isn't an expense — it's a revenue multiplier.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Look at your top competitor's product visuals. Note what makes them look professional.</p>
        </div>
      </>
    ),
  },
  {
    title: "Basics of Design",
    readTime: "6 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Learn fundamental design principles that make visuals effective and professional.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Design Principles You Need</h2>
        <ol className="list-decimal pl-6 space-y-4">
          <li><strong>Hierarchy</strong><p className="text-muted-foreground mt-1">Guide the eye to the most important elements first. Use size, color, and position to create visual priority.</p></li>
          <li><strong>Contrast</strong><p className="text-muted-foreground mt-1">Make key elements stand out. Dark on light, big on small, bold on regular.</p></li>
          <li><strong>Alignment</strong><p className="text-muted-foreground mt-1">Everything should line up. Misalignment looks unprofessional instantly.</p></li>
          <li><strong>White Space</strong><p className="text-muted-foreground mt-1">Don't fill every pixel. Space creates elegance and readability.</p></li>
          <li><strong>Consistency</strong><p className="text-muted-foreground mt-1">Same colors, fonts, and styles across all your visuals.</p></li>
          <li><strong>Simplicity</strong><p className="text-muted-foreground mt-1">When in doubt, remove elements. Less is almost always more.</p></li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Apply these 6 principles to one of your existing designs. See how much better it looks with intentional hierarchy and spacing.</p>
        </div>
      </>
    ),
  },
  {
    title: "Outline content",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Plan and structure your visual content before diving into design work.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Plan Before You Design</h2>
        <p>The biggest mistake beginners make is opening Canva and starting to drag elements around without a plan. Great design starts with great planning.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Your Content Outline Process</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Define the purpose</strong> — What does this visual need to communicate?</li>
          <li><strong>List the content</strong> — What text, images, and elements are needed?</li>
          <li><strong>Prioritize</strong> — What's the #1 thing people should see first?</li>
          <li><strong>Sketch</strong> — Quick pencil sketch or wireframe of the layout</li>
          <li><strong>Then design</strong> — Now open Canva and execute your plan</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Before your next design, spend 5 minutes outlining. Write down the purpose, content elements, and priority order.</p>
        </div>
      </>
    ),
  },
  {
    title: "Establish a color scheme",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Choose colors that align with your brand and resonate with your audience.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Color Psychology in Digital Products</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Blue</strong> — Trust, professionalism (finance, tech, B2B)</li>
          <li><strong>Green</strong> — Growth, health, money (wellness, finance)</li>
          <li><strong>Red/Orange</strong> — Energy, urgency (fitness, food, sales)</li>
          <li><strong>Purple</strong> — Premium, creative (luxury, education)</li>
          <li><strong>Black/Gold</strong> — Luxury, sophistication (premium brands)</li>
          <li><strong>Warm neutrals</strong> — Approachable, modern (lifestyle, coaching)</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Building Your Palette</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Pick 1 primary color</strong> that represents your brand</li>
          <li><strong>Add 1-2 accent colors</strong> for variety</li>
          <li><strong>Include a neutral</strong> (white, off-white, dark gray) for backgrounds</li>
          <li><strong>Use Coolors.co</strong> to generate complementary palettes</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Create your 4-color palette using Coolors.co and save it to your Canva Brand Kit.</p>
        </div>
      </>
    ),
  },
  {
    title: "Decide on your typography",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Select fonts that enhance readability and strengthen your visual identity.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Fonts Set the Tone</h2>
        <p>Your font choice communicates as much as your words. A playful font says "fun and casual." A clean sans-serif says "modern and professional."</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Font Pairing Rules</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Max 2-3 fonts</strong> — More creates visual chaos</li>
          <li><strong>Contrast your pairs</strong> — Bold display font + clean body font</li>
          <li><strong>Stick with proven combos</strong> — Playfair + Raleway, Montserrat + Open Sans</li>
          <li><strong>Test readability</strong> — If it's hard to read at small sizes, pick another</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Choose your heading and body fonts. Save them in your Canva Brand Kit for consistent use.</p>
        </div>
      </>
    ),
  },
  {
    title: "Generate assets with Midjourney",
    readTime: "6 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Use AI to create unique visual assets that elevate your digital products.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">AI-Powered Design</h2>
        <p>AI image generators like Midjourney, DALL-E, and Leonardo AI can create unique visuals that would cost hundreds in stock photography or custom illustration.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">What AI Can Create</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Product backgrounds</strong> — Custom textures and patterns</li>
          <li><strong>Illustrations</strong> — Unique graphics for ebook covers</li>
          <li><strong>Social media visuals</strong> — Eye-catching post backgrounds</li>
          <li><strong>Brand imagery</strong> — Lifestyle photos that match your brand</li>
          <li><strong>Icons and elements</strong> — Custom design elements</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Prompt Tips</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Be specific about style: "minimalist," "watercolor," "3D render"</li>
          <li>Describe colors: "soft pastel palette," "dark moody tones"</li>
          <li>Specify format: "book cover," "social media post," "icon set"</li>
          <li>Add quality modifiers: "high quality," "professional," "clean"</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Generate 5 AI images for your next product. Experiment with different styles and prompts.</p>
        </div>
      </>
    ),
  },
  {
    title: "Design eBook cover",
    readTime: "6 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Create eye-catching eBook covers that attract buyers and convey value.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Your Cover Is Your Billboard</h2>
        <p>People literally judge books by their covers. Your ebook cover is the single most important visual in your product catalog.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Cover Design Essentials</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Title prominence</strong> — The title should be readable even at thumbnail size</li>
          <li><strong>Subtitle clarity</strong> — What will the reader learn or gain?</li>
          <li><strong>Visual hierarchy</strong> — Title → Subtitle → Author/Brand → Imagery</li>
          <li><strong>Professional imagery</strong> — Use AI-generated or high-quality stock photos</li>
          <li><strong>Brand colors</strong> — Apply your brand palette consistently</li>
          <li><strong>Clean layout</strong> — Don't overcrowd — less is more</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">📐</span>
          <p className="text-muted-foreground"><strong>Dimensions:</strong> Standard ebook cover is 1600 x 2560 pixels (1:1.6 ratio). Always export at high resolution.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Design an ebook cover using a Master Library template or create one from scratch in Canva.</p>
        </div>
      </>
    ),
  },
  {
    title: "Utilize premium mockups",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Use professional mockups to showcase your products in a realistic, premium way.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Mockups Transform Perception</h2>
        <p>A flat PDF screenshot looks amateur. The same product in a 3D mockup on a desk with a coffee cup looks premium. Mockups bridge the gap between digital and tangible.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Types of Mockups</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Device mockups</strong> — Laptop, iPad, phone screens</li>
          <li><strong>Book mockups</strong> — 3D book covers, open book spreads</li>
          <li><strong>Bundle mockups</strong> — Multiple products displayed together</li>
          <li><strong>Lifestyle mockups</strong> — Products in real-world settings</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Where to Find Mockups</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Master Library</strong> — Premium mockup templates included</li>
          <li><strong>Smartmockups</strong> — Free online mockup generator</li>
          <li><strong>Canva</strong> — Built-in mockup frames and templates</li>
          <li><strong>Freepik</strong> — Large collection of free mockup files</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Create a mockup for your main product using the Master Library mockup templates.</p>
        </div>
      </>
    ),
  },
  {
    title: "Create product thumbnails",
    readTime: "5 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Design compelling thumbnails that stop the scroll and drive clicks.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Thumbnails Are Your Storefront</h2>
        <p>On marketplaces, social media, and search results, your thumbnail is the first (and sometimes only) thing people see. It needs to communicate value in a split second.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">Thumbnail Best Practices</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Bold, readable title</strong> — Must be legible even at small sizes</li>
          <li><strong>High contrast</strong> — Text should pop against the background</li>
          <li><strong>Product mockup</strong> — Show what they're getting</li>
          <li><strong>Consistent branding</strong> — Same style across all your products</li>
          <li><strong>Simple composition</strong> — One focal point, minimal clutter</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">📐</span>
          <p className="text-muted-foreground"><strong>Recommended Sizes:</strong> 1280x720 (16:9) for marketplaces, 1080x1080 for Instagram, 1000x1500 for Pinterest.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Design thumbnails for your top 3 products. Use the Master Library thumbnail templates as starting points.</p>
        </div>
      </>
    ),
  },
  {
    title: "Create once, reuse multiple times",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Build a design system that lets you create faster and maintain consistency.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">The Template System</h2>
        <p>Professional designers don't start from scratch every time. They build templates and systems that make creating new designs fast and consistent.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">What to Template</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Product covers</strong> — One master template, swap text and images</li>
          <li><strong>Social media posts</strong> — 5-10 templates you rotate through</li>
          <li><strong>Email headers</strong> — Consistent banner for all emails</li>
          <li><strong>Thumbnails</strong> — Same layout, different content</li>
          <li><strong>Story templates</strong> — Branded Instagram/TikTok story frames</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">⚡</span>
          <p className="text-muted-foreground"><strong>Time Savings:</strong> Once you have templates, creating a new product visual goes from 2 hours to 15 minutes.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Create a master template for your product covers in Canva. Duplicate it for each new product.</p>
        </div>
      </>
    ),
  },
  {
    title: "Finalize and export",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Prepare your designs for publishing with proper export settings and formats.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Export Like a Pro</h2>
        <h2 className="text-2xl font-bold text-foreground mt-10">File Formats Guide</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>PNG</strong> — Best for graphics with transparency, logos, icons</li>
          <li><strong>JPG</strong> — Best for photos and thumbnails (smaller file size)</li>
          <li><strong>PDF</strong> — Best for ebooks and downloadable content</li>
          <li><strong>SVG</strong> — Best for logos and scalable graphics</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Quality Checklist</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3"><span>☐</span><span>All text is spelled correctly</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Colors are consistent with brand palette</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Images are high resolution (not pixelated)</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Alignment is clean and intentional</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>File is exported at the correct dimensions</span></li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Export your designs in the correct formats. Create a folder structure to organize all your visual assets.</p>
        </div>
      </>
    ),
  },
  {
    title: "Repurpose content with Shots.so",
    readTime: "4 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Transform your visuals into multiple formats for different platforms and uses.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">One Design, Multiple Uses</h2>
        <p>Shots.so is a free tool that lets you create beautiful screenshots, mockups, and presentation-style visuals from your existing designs. It's perfect for social media and marketing.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">What You Can Create</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Browser-frame screenshots for product previews</li>
          <li>Device mockups with custom backgrounds</li>
          <li>Social media-ready visuals in multiple sizes</li>
          <li>Presentation-style slides from your content</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Take a screenshot of your product page and run it through Shots.so. Use the output for your social media marketing.</p>
        </div>
      </>
    ),
  },
  {
    title: "Recap and feedback",
    readTime: "3 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Review your design process and gather insights for continuous improvement.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Your Visual Transformation</h2>
        <p>Compare your visuals from the start of this course to now. You should see a dramatic improvement in:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Color consistency and brand recognition</li>
          <li>Typography choices and readability</li>
          <li>Professional mockup usage</li>
          <li>Thumbnail quality and click-worthiness</li>
          <li>Overall design polish and confidence</li>
        </ul>
        <h2 className="text-2xl font-bold text-foreground mt-10">Getting Feedback</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Share your designs in relevant communities for honest feedback</li>
          <li>A/B test different visuals to see which performs better</li>
          <li>Ask customers what drew them to your product</li>
          <li>Continuously study designs you admire and learn from them</li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Share your best design in a community and ask for specific feedback on one element you want to improve.</p>
        </div>
      </>
    ),
  },
  {
    title: "Book Cover Templates",
    readTime: "3 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">120+ professional book cover templates ready to customize in Canva.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Your Template Library</h2>
        <p>Included with the Master Library are 120+ professionally designed book cover templates. Each one is fully editable in Canva — just swap the text, colors, and images to match your brand.</p>
        <h2 className="text-2xl font-bold text-foreground mt-10">How to Use Templates</h2>
        <ol className="list-decimal pl-6 space-y-3">
          <li><strong>Browse the collection</strong> — Find a style that matches your brand</li>
          <li><strong>Open in Canva</strong> — Click the Canva link to open the editable version</li>
          <li><strong>Customize</strong> — Change title, subtitle, colors, fonts, and imagery</li>
          <li><strong>Export</strong> — Download as high-resolution PNG or PDF</li>
        </ol>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💡</span>
          <p className="text-muted-foreground"><strong>Tip:</strong> Don't just use one template. Try 3-4 variations of your cover and ask your audience which one they prefer.</p>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Pick 3 templates that match your brand aesthetic. Customize one for your next product.</p>
        </div>
      </>
    ),
  },
  {
    title: "Visuals Checklist",
    readTime: "3 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">A comprehensive checklist to ensure your visuals meet professional standards.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Your Visual Quality Checklist</h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3"><span>☐</span><span>Brand colors are consistent across all visuals</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Fonts are limited to 2-3 and match brand personality</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Product cover is eye-catching and readable at thumbnail size</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Mockups are used to showcase products professionally</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Thumbnails have high contrast and clear text</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>All images are high resolution</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>White space is used intentionally</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Design templates are saved for reuse</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Files are exported in correct formats and dimensions</span></li>
          <li className="flex items-start gap-3"><span>☐</span><span>Visuals are tested on mobile (most buyers browse on phones)</span></li>
        </ul>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">🎉</span>
          <p className="text-muted-foreground"><strong>Congratulations!</strong> You've completed "How to Design Stunning Visuals." Your products now have the visual quality to compete with the best in your market.</p>
        </div>
      </>
    ),
  },
  {
    title: "Tools Library",
    readTime: "3 min read",
    content: (
      <>
        <p className="italic text-muted-foreground text-base">Access a curated collection of design tools to streamline your workflow.</p>
        <h2 className="text-2xl font-bold text-foreground mt-8">Essential Design Tools</h2>
        <div className="space-y-4 mt-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">🎨 Canva</p>
            <p className="text-muted-foreground">Your all-in-one design platform. Covers, social posts, mockups, and more.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">🎭 Midjourney / Leonardo AI</p>
            <p className="text-muted-foreground">AI image generators for unique visual assets and illustrations.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">📸 Unsplash / Pexels</p>
            <p className="text-muted-foreground">Free high-quality stock photography.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">🎨 Coolors.co</p>
            <p className="text-muted-foreground">Generate beautiful color palettes in seconds.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">📱 Smartmockups</p>
            <p className="text-muted-foreground">Free online mockup generator for devices and products.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">📷 Shots.so</p>
            <p className="text-muted-foreground">Beautiful screenshot mockups for marketing.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">✏️ Google Fonts</p>
            <p className="text-muted-foreground">Free professional fonts for any project.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="font-bold text-foreground">🗜️ TinyPNG</p>
            <p className="text-muted-foreground">Compress images without losing quality.</p>
          </div>
        </div>
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">✅</span>
          <p className="text-muted-foreground"><strong>Action Step:</strong> Bookmark all these tools. Set up accounts on the ones you'll use most. You now have a complete design toolkit.</p>
        </div>
      </>
    ),
  },
];
