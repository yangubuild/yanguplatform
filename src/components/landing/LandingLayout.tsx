import { LandingSidebar } from "./LandingSidebar";
import { TrendMarquee } from "./TrendMarquee";
import { LandingHeader } from "./LandingHeader";
import { HeroNew } from "./HeroNew";
import { SearchBar } from "./SearchBar";
import { FeaturedCards } from "./FeaturedCards";

export function LandingLayout() {
  return (
    <div className="landing-page min-h-screen bg-[hsl(0_0%_4%)]">
      {/* Sidebar */}
      <LandingSidebar />

      {/* Main Content Area */}
      <main className="ml-60 min-h-screen flex flex-col">
        {/* Trend Marquee */}
        <TrendMarquee />

        {/* Header with Auth Buttons */}
        <LandingHeader />

        {/* Hero Section */}
        <HeroNew />

        {/* Search Bar */}
        <SearchBar />

        {/* Featured Cards */}
        <FeaturedCards />
      </main>
    </div>
  );
}
