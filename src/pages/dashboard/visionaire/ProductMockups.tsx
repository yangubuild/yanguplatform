import { useState } from "react";
import { ExternalLink, Sparkles } from "lucide-react";
import { VisionairePageContainer } from "@/components/visionaire/VisionairePageContainer";
import { BoxMockupGallery, type BoxMockup } from "@/components/visionaire/mockups/BoxMockupGallery";
import { BoxMockupEditor } from "@/components/visionaire/mockups/BoxMockupEditor";

import gradientsImg from "@/assets/mockups/gradients.png";
import shotsSoImg from "@/assets/mockups/shots-so.jpg";
import boxMockupsImg from "@/assets/mockups/box-mockups.png";

type ResourceType = "external" | "ai" | "coming-soon";

interface Resource {
  id: string;
  title: string;
  description: string;
  image: string;
  url: string;
  type: ResourceType;
}

const RESOURCES: Resource[] = [
  {
    id: "gradients",
    title: "Gradients",
    description: "Beautiful gradient backgrounds and patterns",
    image: gradientsImg,
    url: "https://unsplash.com/s/photos/Gradient-background",
    type: "external",
  },
  {
    id: "shots-so",
    title: "Shots.so",
    description: "Professional screenshot templates",
    image: shotsSoImg,
    url: "https://shots.so",
    type: "external",
  },
  {
    id: "box-mockups",
    title: "Box Mockups",
    description: "3D product box mockup templates",
    image: boxMockupsImg,
    url: "",
    type: "ai",
  },
];

type ResourceType = "external" | "ai" | "coming-soon";
type View = "grid" | "box-gallery" | "box-editor";

export default function ProductMockups() {
  const [activeView, setActiveView] = useState<View>("grid");
  const [selectedMockup, setSelectedMockup] = useState<BoxMockup | null>(null);

  const handleCardClick = (resource: (typeof RESOURCES)[number]) => {
    if (resource.type === "external") {
      window.open(resource.url, "_blank", "noopener,noreferrer");
    } else if (resource.type === "ai") {
      setActiveView("box-gallery");
    }
    // "coming-soon" does nothing
  };

  const handleUseMockup = (mockup: BoxMockup) => {
    setSelectedMockup(mockup);
    setActiveView("box-editor");
  };

  if (activeView === "box-editor" && selectedMockup) {
    return (
      <VisionairePageContainer>
        <BoxMockupEditor
          mockup={selectedMockup}
          onBack={() => setActiveView("box-gallery")}
        />
      </VisionairePageContainer>
    );
  }

  if (activeView === "box-gallery") {
    return (
      <VisionairePageContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-foreground">Box Mockups</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a mockup to generate new angles or apply custom designs with AI
              </p>
            </div>
            <button
              onClick={() => setActiveView("grid")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
          </div>
          <BoxMockupGallery onUse={handleUseMockup} />
        </div>
      </VisionairePageContainer>
    );
  }

  return (
    <VisionairePageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">Design Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Professional mockups and design tools for your digital products
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {RESOURCES.map((r) => (
            <button
              key={r.id}
              onClick={() => handleCardClick(r)}
              className="group text-left rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="overflow-hidden">
                <img
                  src={r.image}
                  alt={r.title}
                  className="w-full aspect-[4/3] object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-foreground">{r.title}</h3>
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground border border-border rounded-lg px-4 py-2 w-full justify-center hover:bg-muted transition-colors">
                    {r.type === "ai" ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate
                      </>
                    ) : r.type === "coming-soon" ? (
                      "Coming Soon"
                    ) : (
                      <>
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open
                      </>
                    )}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </VisionairePageContainer>
  );
}
