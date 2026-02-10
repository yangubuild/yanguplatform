export function SubscribeCta() {
  return (
    <section className="w-full px-6" style={{ backgroundColor: "#FFFFFF" }}>
      <div
        className="mx-auto my-10 flex max-w-[1200px] items-center justify-between overflow-hidden rounded-2xl px-10 py-16"
        style={{ backgroundColor: "#111827" }}
      >
        <div>
          <h2 className="max-w-[360px] text-[24px] font-bold leading-tight text-white sm:text-[28px]">
            Be the first to
            <br />
            know about new creators
            <br />
            and communities
          </h2>
          <button className="mt-5 rounded-lg border border-white/30 px-5 py-[8px] text-[13px] font-medium text-white transition-colors hover:bg-white/10">
            Subscribe to Discover
          </button>
        </div>
        <div className="hidden gap-3 sm:flex">
          <div className="h-[140px] w-[140px] rounded-xl bg-gradient-to-br from-teal-400 to-teal-600" />
          <div className="h-[140px] w-[140px] rounded-xl bg-gradient-to-br from-amber-300 to-amber-500" />
        </div>
      </div>
    </section>
  );
}
