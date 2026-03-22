import { Search } from "lucide-react";
import chatIcon2 from "@/assets/chat_icon_2.png";
import { T } from "@/lib/typography";

export function CommunityHero() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 pt-2 pb-6">
      {/* Title & Subtitle */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <img src={chatIcon2} alt="Community" className="w-8 h-8 object-contain" />
        </div>
        <h1 className={`${T.hero} text-foreground`}>
          Build and run your community
        </h1>
        <p className={`mt-2 ${T.subheader} text-muted-foreground`}>
          Find communities, creators, and products that transform your life
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center">
        <div
          className="relative flex items-center w-full max-w-md">
          <Search className="absolute left-4 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-11 pr-4 py-3 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
            style={{
              background: '#152A20',
              border: '1px solid rgba(255,255,255,0.12)' }}
          />
        </div>
      </div>
    </div>
  );
}
