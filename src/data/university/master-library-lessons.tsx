import creationTrapCycleImg from "@/assets/university/creation-trap-cycle.png";
import editablePlrImg from "@/assets/university/editable-plr-products.jpg";

export interface LessonData {
  title: string;
  readTime?: string;
  content: React.ReactNode;
}

export const MASTER_LIBRARY_LESSONS: LessonData[] = [
  {
    title: "The Curator Mindset",
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
        <p>
          This is the content creation trap, and it's the #1 reason people never launch.
        </p>
        <p>
          The math is brutal: a single quality ebook takes 80-200 hours to create from scratch. A
          video course? Even more. And that's <em>one</em> product. To build a real business, you need
          multiple products, lead magnets, email sequences, social content, all of it..
        </p>
        <p>
          No one has that kind of time. Especially not if you're building on the side of a job, a
          coaching practice, or an existing business.
        </p>

        {/* Creation Trap Cycle image */}
        <div className="my-8 flex justify-center">
          <img
            src={creationTrapCycleImg}
            alt="The Creation Trap Cycle - Idea, Research, Create, Perfectionism, Restart, Never Launch"
            className="max-w-md w-full"
          />
        </div>

        <h2 className="text-2xl font-bold text-foreground mt-10">The Shift: Creator → Curator</h2>
        <p>
          The solution isn't to work harder or faster at creating. It's to stop creating from scratch
          entirely.
        </p>
        <p>
          Think about it this way: the most successful digital businesses aren't built by people
          who make everything themselves. They're built by people who are great at{" "}
          <strong>finding, customizing, and positioning</strong> products for the right audience.
        </p>
        <p>That's the curator mindset.</p>

        {/* Callout box */}
        <div className="my-8 rounded-xl border border-border bg-card p-6 space-y-3">
          <span className="text-xl">💡</span>
          <p className="text-muted-foreground">
            A creator says: "I need to build this from nothing." A curator says: "I have 1,000+
            ready-made products. Which one does my audience need most?"
          </p>
          <p className="text-muted-foreground">
            That's the difference between someone who launches 4 products in two years,
            and someone who launches 4 in their first month.
          </p>
        </div>

        <p>
          With the Master Library, you're not starting from zero. You're starting with a library of
          professionally designed, expertly written digital products: ebooks, courses, templates,
          checklists, audio content, and more. Your job is to pick the right ones, make them
          yours, and get them in front of people who need them.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">What "Ready-to-Brand" Actually Means</h2>
        <p>
          If you've heard of PLR (Private Label Rights) before, you might picture outdated PDFs
          with clip art and generic advice. That's not what this is.
        </p>
        <p>Every product in the Master Library is:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Professionally designed</strong> – clean, modern layouts you'd be proud to sell
          </li>
          <li>
            <strong>Expertly written</strong> – real content with depth, not AI filler or recycled fluff
          </li>
          <li>
            <strong>Fully editable</strong> – delivered in Canva, Google Docs, and DOCX formats so you can
            change anything
          </li>
          <li>
            <strong>Commercially licensed</strong> – you can brand it, customize it, and sell it as your own
            product
          </li>
        </ul>

        {/* Editable PLR Products image */}
        <div className="my-8 flex justify-center">
          <img
            src={editablePlrImg}
            alt="Editable PLR Products"
            className="w-full rounded-lg"
          />
          <p className="text-center text-xs text-muted-foreground mt-2 hidden">Editable PLR Products</p>
        </div>
        <p className="text-center text-xs text-muted-foreground -mt-4">Editable PLR Products</p>

        <p>
          You're not buying a finished product to resell as-is (though you could). You're getting a
          professional foundation that you turn into <em>your</em> product, with your name, your voice,
          your brand, and your perspective.
        </p>
        <p>
          The best part? What used to take weeks of customization now takes under an hour with
          the right approach, especially with AI tools to speed up the process. We'll cover exactly
          how in Module 3.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">What You Can (and Can't) Do</h2>
        <p>Let's make the license crystal clear. No legal jargon, just straight facts.</p>

        <h3 className="text-lg font-bold text-foreground mt-6">✅ You can:</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Rebrand and sell</strong> any product as your own – ebooks, courses, templates, all of it
          </li>
          <li>
            <strong>Edit everything</strong> – change the text, swap designs, add your links, rewrite sections
          </li>
          <li>
            <strong>Use them anywhere</strong> – your website, social media, email list, paid offers, lead
            magnets, blog
          </li>
          <li>
            <strong>Bundle products</strong> together to create higher-value offers
          </li>
          <li>
            <strong>Add affiliate links</strong> or promote your own services inside the content
          </li>
          <li>
            <strong>Give products away</strong> as lead magnets or bonuses
          </li>
        </ul>

        <h3 className="text-lg font-bold text-foreground mt-6">❌ You cannot:</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Resell the entire Master Library</strong> as a collection – you can use individual products,
            but you can't repackage the whole library concept
          </li>
          <li>
            <strong>Pass along resell rights</strong> – your customers can use what they buy from you, but they
            can't turn around and resell it to others
          </li>
        </ul>

        <p className="mt-6">
          That's it. Within those boundaries, you have massive freedom to build whatever you
          want.
        </p>

        <h2 className="text-2xl font-bold text-foreground mt-10">What's Ahead</h2>
        <p>
          This course is designed to get you from "I just got access" to "my first product is live"
          as fast and practically as possible. Here's the path:
        </p>
        <ol className="list-decimal pl-6 space-y-3">
          <li>
            <strong>Find Your First Product</strong> (Module 2) – Navigate the library and pick the right product
            for your niche
          </li>
          <li>
            <strong>Make It Yours</strong> (Module 3) – Customize, brand, and polish it using Canva, Google
            Docs, and AI tools
          </li>
          <li>
            <strong>Package, Price & Launch</strong> (Module 4) – Turn your product into an offer and get your
            first sales page live
          </li>
          <li>
            <strong>Grow From Here</strong> (Module 5) – Repurpose, scale, and build a real product business
            over time
          </li>
        </ol>

        <p className="mt-6">
          No fluff. No "believe in yourself" filler. Just the practical steps to go live.
        </p>
        <p>Let's start by finding your first product.</p>
      </>
    ),
  },
  {
    title: "Find Your First Product",
    readTime: "5 min read",
    content: (
      <p className="text-muted-foreground">Lesson content coming soon.</p>
    ),
  },
  {
    title: "Make It Yours",
    readTime: "5 min read",
    content: (
      <p className="text-muted-foreground">Lesson content coming soon.</p>
    ),
  },
  {
    title: "Package, Price & Launch",
    readTime: "5 min read",
    content: (
      <p className="text-muted-foreground">Lesson content coming soon.</p>
    ),
  },
  {
    title: "Grow From Here",
    readTime: "5 min read",
    content: (
      <p className="text-muted-foreground">Lesson content coming soon.</p>
    ),
  },
];
