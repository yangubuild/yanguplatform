import { Download, Maximize2, Sparkles } from "lucide-react";

import boxTall from "@/assets/mockups/boxes/box-tall.jpg";
import boxCube from "@/assets/mockups/boxes/box-cube.jpg";
import boxCube2 from "@/assets/mockups/boxes/box-cube2.jpg";
import boxFlat from "@/assets/mockups/boxes/box-flat.jpg";
import boxBranded from "@/assets/mockups/boxes/box-branded.jpg";
import bookHardcover from "@/assets/mockups/boxes/book-hardcover.jpg";
import bookStanding from "@/assets/mockups/boxes/book-standing.jpg";
import bookSet from "@/assets/mockups/boxes/book-set.jpg";
import boxSet from "@/assets/mockups/boxes/box-set.jpg";
import cubeClean from "@/assets/mockups/boxes/cube-clean.jpg";
import bookTemplateSet from "@/assets/mockups/boxes/book-template-set.jpg";
import whiteBoxSet from "@/assets/mockups/boxes/white-box-set.jpg";
import cubes3 from "@/assets/mockups/boxes/cubes3.jpg";

export interface BoxMockup {
  id: string;
  label: string;
  src: string;
}

export const BOX_MOCKUPS: BoxMockup[] = [
  { id: "box-tall", label: "Tall Box", src: boxTall },
  { id: "box-cube", label: "Cube Box", src: boxCube },
  { id: "box-cube2", label: "Square Box", src: boxCube2 },
  { id: "box-flat", label: "Flat Box", src: boxFlat },
  { id: "box-branded", label: "Branded Box", src: boxBranded },
  { id: "cube-clean", label: "Clean Cube", src: cubeClean },
  { id: "box-set", label: "Box Set", src: boxSet },
  { id: "book-hardcover", label: "Hardcover Book", src: bookHardcover },
  { id: "book-standing", label: "Standing Book", src: bookStanding },
  { id: "book-set", label: "Book Set", src: bookSet },
  { id: "book-template-set", label: "Book Templates", src: bookTemplateSet },
  { id: "white-box-set", label: "White Box Set", src: whiteBoxSet },
  { id: "cubes3", label: "Cube Collection", src: cubes3 },
];

interface BoxMockupGalleryProps {
  onUse: (mockup: BoxMockup) => void;
}

export function BoxMockupGallery({ onUse }: BoxMockupGalleryProps) {
  const handleDownload = (mockup: BoxMockup, e: React.MouseEvent) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = mockup.src;
    a.download = `${mockup.id}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePreview = (mockup: BoxMockup, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(mockup.src, "_blank");
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {BOX_MOCKUPS.map((mockup) => (
        <div
          key={mockup.id}
          className="group relative rounded-xl border border-border overflow-hidden bg-muted aspect-square"
        >
          <img
            src={mockup.src}
            alt={mockup.label}
            className="w-full h-full object-cover"
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3">
            {/* Top-right icon row */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
              <button
                onClick={(e) => handlePreview(mockup, e)}
                className="p-1.5 rounded-md bg-foreground/80 text-background hover:bg-foreground transition-colors"
                title="Preview"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => handleDownload(mockup, e)}
                className="p-1.5 rounded-md bg-foreground/80 text-background hover:bg-foreground transition-colors"
                title="Download"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Use button */}
            <button
              onClick={() => onUse(mockup)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors shadow-lg"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Use
            </button>
          </div>

          {/* Label */}
          <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-medium text-foreground">{mockup.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
