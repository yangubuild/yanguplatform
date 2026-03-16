import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import getStarted1 from "@/assets/landing-get-started-university.png";
import getStarted2 from "@/assets/landing-get-started-micro.png";
import iconVisionaire from "@/assets/icon-visionaire.png";
import iconYangu from "@/assets/icon-yangu-micro.png";
import { T } from "@/lib/typography";

export function LandingTestGettingStarted() {
  const navigate = useNavigate();

  return (
    <section className="mb-12">
      <h2 className={`text-white ${T.sectionH2} mb-5`}>Getting started</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left card */}
        <div className="overflow-hidden rounded-2xl h-[160px] relative group">
          <img
            src={getStarted1}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <button
            onClick={() => navigate("/auth/login")}
            className="absolute bottom-4 left-4 flex flex-col gap-0.5 text-left"
          >
            <span className="flex items-center gap-2">
              <img src={iconVisionaire} alt="" className="w-7 h-7 rounded-lg" />
              <span className={`text-white ${T.cardTitle} flex items-center gap-1`}>
                Visionaire digital university
                <ChevronRight className="w-4 h-4" />
              </span>
            </span>
            <span className={`text-white/70 ${T.body} pl-9`}>
              Learn how to grow and build on yangu
            </span>
          </button>
        </div>

        {/* Right card */}
        <div className="overflow-hidden rounded-2xl h-[160px] relative group">
          <img
            src={getStarted2}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          <button
            onClick={() => navigate("/auth/login")}
            className="absolute bottom-4 left-4 flex flex-col gap-0.5 text-left"
          >
            <span className="flex items-center gap-2">
              <img src={iconYangu} alt="" className="w-7 h-7 rounded-lg" />
              <span className={`text-white ${T.cardTitle} flex items-center gap-1`}>
                Micro-Influence
                <ChevronRight className="w-4 h-4" />
              </span>
            </span>
            <span className={`text-white/70 ${T.body} pl-9`}>
              Get paid for promoting products
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
