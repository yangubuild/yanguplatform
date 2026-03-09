import { Input } from "@/components/ui/input";
import { Globe, MapPin } from "lucide-react";
import type { CampaignData } from "../CampaignWizard";

interface SetupStepProps {
  data: CampaignData;
  onChange: (data: CampaignData) => void;
}

// Mock products
const MOCK_PRODUCTS = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&h=120&fit=crop",
    title: "Premium Starter Kit",
    price: "$49",
    members: "1.2K members",
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&h=120&fit=crop",
    title: "Growth Accelerator",
    price: "$99",
    members: "856 orders",
  },
];

export function SetupStep({ data, onChange }: SetupStepProps) {
  return (
    <div className="space-y-8 max-w-2xl">
      {/* Campaign name */}
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Campaign name
        </label>
        <Input
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="Enter campaign name"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-11"
        />
      </div>

      {/* Select product */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Select a product for your campaign
        </label>
        <div className="space-y-3">
          {MOCK_PRODUCTS.map((product) => (
            <div
              key={product.id}
              onClick={() => onChange({ ...data, selectedProduct: product.id })}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                data.selectedProduct === product.id
                  ? "ring-2 ring-blue-500 bg-blue-500/5"
                  : "bg-white/[0.03] hover:bg-white/[0.06] border border-white/10"
              }`}
            >
              <img
                src={product.image}
                alt={product.title}
                className="w-14 h-14 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white">{product.title}</h4>
                <p className="text-xs text-white/40 mt-0.5">{product.price}</p>
              </div>
              <span className="text-xs text-white/30">{product.members}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Target location */}
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Target location
        </label>

        <div
          onClick={() => onChange({ ...data, globalReach: !data.globalReach })}
          className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all mb-3 ${
            data.globalReach
              ? "ring-2 ring-blue-500 bg-blue-500/5"
              : "bg-white/[0.03] border border-white/10"
          }`}
        >
          <Globe className="w-5 h-5 text-blue-400" />
          <div>
            <span className="text-sm font-medium text-white">Global reach</span>
            <p className="text-xs text-white/40">
              Show your ads to users worldwide
            </p>
          </div>
          <div
            className={`ml-auto w-10 h-6 rounded-full transition-colors flex items-center ${
              data.globalReach ? "bg-blue-600 justify-end" : "bg-white/10 justify-start"
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white mx-0.5 shadow" />
          </div>
        </div>

        {!data.globalReach && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-white/30" />
            <Input
              value={data.location}
              onChange={(e) => onChange({ ...data, location: e.target.value })}
              placeholder="Enter location..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-10"
            />
          </div>
        )}
      </div>
    </div>
  );
}
