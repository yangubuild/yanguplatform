const featuredItems = [
  {
    id: 1,
    title: "Social & Media Agency",
    category: "Inspiration",
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop",
  },
  {
    id: 2,
    title: "Job Search",
    category: "Templates",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    title: "Real Estate",
    category: "Inspiration",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop",
  },
];

export function FeaturedCards() {
  return (
    <section className="px-6 py-8">
      {/* Section Label */}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[hsl(0_0%_40%)] mb-4">
        Featured
      </h2>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredItems.map((item) => (
          <a
            key={item.id}
            href="#"
            className="group block rounded-xl overflow-hidden bg-[hsl(0_0%_10%)] border border-[hsl(0_0%_15%)] hover:border-[hsl(0_0%_25%)] transition-colors"
          >
            {/* Image */}
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-sm font-medium text-white mb-2">{item.title}</h3>
              <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-[hsl(0_0%_15%)] text-[hsl(0_0%_60%)]">
                {item.category}
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
