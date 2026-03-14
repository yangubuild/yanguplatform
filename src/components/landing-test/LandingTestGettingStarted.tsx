import { useNavigate } from "react-router-dom";
import getStarted1 from "@/assets/landing-get-started-university.png";
import getStarted2 from "@/assets/landing-get-started-2.png";

export function LandingTestGettingStarted() {
  const navigate = useNavigate();

  return (
    <section className="mb-12">
      <h2 className="text-white text-xl font-bold mb-5">Getting started</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/auth/login")}
          className="overflow-hidden rounded-2xl h-[160px] relative group"
        >
          <img src={getStarted1} alt="Viisoniare Digital University" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        </button>
        <button
          onClick={() => navigate("/dashboard/affiliates")}
          className="overflow-hidden rounded-2xl h-[160px] relative group"
        >
          <img src={getStarted2} alt="Micro-Influence" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        </button>
      </div>
    </section>
  );
}
