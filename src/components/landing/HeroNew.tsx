import yangu3dLogo from "@/assets/yangu-3d-logo.png";

export function HeroNew() {
  return (
    <section className="px-6 py-8 lg:py-12">
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 lg:gap-12">
        {/* Left Side - Text Content */}
        <div className="flex-1 max-w-xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            <span className="block">Build and.</span>
            <span className="block">Sell Online.</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-[hsl(0_0%_50%)] max-w-md">
            An Internet Business hub that exists to deliver sustainable income for everyone.
          </p>
        </div>

        {/* Right Side - 3D Logo */}
        <div className="flex-shrink-0 w-48 md:w-64 lg:w-80">
          <img
            src={yangu3dLogo}
            alt="Yangu 3D Logo"
            className="w-full h-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
}
