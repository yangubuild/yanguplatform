import { useState, useMemo } from "react";
import { Globe, ChevronDown, Search, Check } from "lucide-react";
import type { CampaignData } from "../CampaignWizard";

interface SetupStepProps {
  data: CampaignData;
  onChange: (data: CampaignData) => void;
}

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

interface GeoEntry {
  type: "continent" | "country";
  name: string;
  continent?: string;
}

const GEO_DATA: GeoEntry[] = [
  // Africa
  { type: "continent", name: "Africa" },
  { type: "country", name: "Algeria", continent: "Africa" },
  { type: "country", name: "Angola", continent: "Africa" },
  { type: "country", name: "Benin", continent: "Africa" },
  { type: "country", name: "Botswana", continent: "Africa" },
  { type: "country", name: "Burkina Faso", continent: "Africa" },
  { type: "country", name: "Burundi", continent: "Africa" },
  { type: "country", name: "Cameroon", continent: "Africa" },
  { type: "country", name: "Cape Verde", continent: "Africa" },
  { type: "country", name: "Central African Republic", continent: "Africa" },
  { type: "country", name: "Chad", continent: "Africa" },
  { type: "country", name: "Comoros", continent: "Africa" },
  { type: "country", name: "Congo", continent: "Africa" },
  { type: "country", name: "Côte d'Ivoire", continent: "Africa" },
  { type: "country", name: "DR Congo", continent: "Africa" },
  { type: "country", name: "Djibouti", continent: "Africa" },
  { type: "country", name: "Egypt", continent: "Africa" },
  { type: "country", name: "Equatorial Guinea", continent: "Africa" },
  { type: "country", name: "Eritrea", continent: "Africa" },
  { type: "country", name: "Eswatini", continent: "Africa" },
  { type: "country", name: "Ethiopia", continent: "Africa" },
  { type: "country", name: "Gabon", continent: "Africa" },
  { type: "country", name: "Gambia", continent: "Africa" },
  { type: "country", name: "Ghana", continent: "Africa" },
  { type: "country", name: "Guinea", continent: "Africa" },
  { type: "country", name: "Guinea-Bissau", continent: "Africa" },
  { type: "country", name: "Kenya", continent: "Africa" },
  { type: "country", name: "Lesotho", continent: "Africa" },
  { type: "country", name: "Liberia", continent: "Africa" },
  { type: "country", name: "Libya", continent: "Africa" },
  { type: "country", name: "Madagascar", continent: "Africa" },
  { type: "country", name: "Malawi", continent: "Africa" },
  { type: "country", name: "Mali", continent: "Africa" },
  { type: "country", name: "Mauritania", continent: "Africa" },
  { type: "country", name: "Mauritius", continent: "Africa" },
  { type: "country", name: "Morocco", continent: "Africa" },
  { type: "country", name: "Mozambique", continent: "Africa" },
  { type: "country", name: "Namibia", continent: "Africa" },
  { type: "country", name: "Niger", continent: "Africa" },
  { type: "country", name: "Nigeria", continent: "Africa" },
  { type: "country", name: "Rwanda", continent: "Africa" },
  { type: "country", name: "Senegal", continent: "Africa" },
  { type: "country", name: "Seychelles", continent: "Africa" },
  { type: "country", name: "Sierra Leone", continent: "Africa" },
  { type: "country", name: "Somalia", continent: "Africa" },
  { type: "country", name: "South Africa", continent: "Africa" },
  { type: "country", name: "South Sudan", continent: "Africa" },
  { type: "country", name: "Sudan", continent: "Africa" },
  { type: "country", name: "Tanzania", continent: "Africa" },
  { type: "country", name: "Togo", continent: "Africa" },
  { type: "country", name: "Tunisia", continent: "Africa" },
  { type: "country", name: "Uganda", continent: "Africa" },
  { type: "country", name: "Zambia", continent: "Africa" },
  { type: "country", name: "Zimbabwe", continent: "Africa" },
  // Europe
  { type: "continent", name: "Europe" },
  { type: "country", name: "United Kingdom", continent: "Europe" },
  { type: "country", name: "France", continent: "Europe" },
  { type: "country", name: "Germany", continent: "Europe" },
  { type: "country", name: "Italy", continent: "Europe" },
  { type: "country", name: "Spain", continent: "Europe" },
  { type: "country", name: "Netherlands", continent: "Europe" },
  { type: "country", name: "Belgium", continent: "Europe" },
  { type: "country", name: "Sweden", continent: "Europe" },
  { type: "country", name: "Switzerland", continent: "Europe" },
  { type: "country", name: "Poland", continent: "Europe" },
  { type: "country", name: "Portugal", continent: "Europe" },
  { type: "country", name: "Ireland", continent: "Europe" },
  // Middle East
  { type: "continent", name: "Middle East" },
  { type: "country", name: "United Arab Emirates", continent: "Middle East" },
  { type: "country", name: "Saudi Arabia", continent: "Middle East" },
  { type: "country", name: "Qatar", continent: "Middle East" },
  { type: "country", name: "Kuwait", continent: "Middle East" },
  { type: "country", name: "Bahrain", continent: "Middle East" },
  { type: "country", name: "Oman", continent: "Middle East" },
  { type: "country", name: "Jordan", continent: "Middle East" },
  { type: "country", name: "Lebanon", continent: "Middle East" },
  { type: "country", name: "Israel", continent: "Middle East" },
  { type: "country", name: "Turkey", continent: "Middle East" },
  // Asia
  { type: "continent", name: "Asia" },
  { type: "country", name: "China", continent: "Asia" },
  { type: "country", name: "India", continent: "Asia" },
  { type: "country", name: "Japan", continent: "Asia" },
  { type: "country", name: "South Korea", continent: "Asia" },
  { type: "country", name: "Indonesia", continent: "Asia" },
  { type: "country", name: "Thailand", continent: "Asia" },
  { type: "country", name: "Vietnam", continent: "Asia" },
  { type: "country", name: "Philippines", continent: "Asia" },
  { type: "country", name: "Malaysia", continent: "Asia" },
  { type: "country", name: "Singapore", continent: "Asia" },
  { type: "country", name: "Pakistan", continent: "Asia" },
  { type: "country", name: "Bangladesh", continent: "Asia" },
  // North America
  { type: "continent", name: "North America" },
  { type: "country", name: "United States", continent: "North America" },
  { type: "country", name: "Canada", continent: "North America" },
  { type: "country", name: "Mexico", continent: "North America" },
  // South America
  { type: "continent", name: "South America" },
  { type: "country", name: "Brazil", continent: "South America" },
  { type: "country", name: "Argentina", continent: "South America" },
  { type: "country", name: "Colombia", continent: "South America" },
  { type: "country", name: "Chile", continent: "South America" },
  { type: "country", name: "Peru", continent: "South America" },
  { type: "country", name: "Venezuela", continent: "South America" },
  { type: "country", name: "Ecuador", continent: "South America" },
  // Oceania
  { type: "continent", name: "Oceania" },
  { type: "country", name: "Australia", continent: "Oceania" },
  { type: "country", name: "New Zealand", continent: "Oceania" },
];

export function SetupStep({ data, onChange }: SetupStepProps) {
  const [search, setSearch] = useState("");
  const [includeMode] = useState<"include" | "exclude">("include");

  const filtered = useMemo(() => {
    if (!search) return GEO_DATA;
    const q = search.toLowerCase();
    const matchingCountries = GEO_DATA.filter(
      (g) => g.type === "country" && g.name.toLowerCase().includes(q)
    );
    const continentsNeeded = new Set(matchingCountries.map((c) => c.continent));
    const matchingContinents = GEO_DATA.filter(
      (g) => g.type === "continent" && (g.name.toLowerCase().includes(q) || continentsNeeded.has(g.name))
    );
    // If a continent matches, show all its countries
    const directContinentMatch = GEO_DATA.filter(
      (g) => g.type === "continent" && g.name.toLowerCase().includes(q)
    ).map((g) => g.name);

    const result: GeoEntry[] = [];
    const shown = new Set<string>();
    for (const g of GEO_DATA) {
      if (g.type === "continent") {
        if (matchingContinents.find((c) => c.name === g.name)) {
          result.push(g);
          shown.add(g.name);
        }
      } else {
        if (
          g.name.toLowerCase().includes(q) ||
          directContinentMatch.includes(g.continent!)
        ) {
          if (g.continent && !shown.has(g.continent)) {
            const cont = GEO_DATA.find((c) => c.type === "continent" && c.name === g.continent);
            if (cont) { result.push(cont); shown.add(g.continent); }
          }
          result.push(g);
        }
      }
    }
    return result;
  }, [search]);

  const toggleLocation = (name: string, type: "continent" | "country") => {
    const sel = data.selectedLocations || [];
    if (type === "continent") {
      const countries = GEO_DATA.filter((g) => g.type === "country" && g.continent === name).map((g) => g.name);
      const allSelected = countries.every((c) => sel.includes(c));
      if (allSelected) {
        onChange({ ...data, selectedLocations: sel.filter((s) => !countries.includes(s) && s !== name) });
      } else {
        const newSel = new Set([...sel, name, ...countries]);
        onChange({ ...data, selectedLocations: Array.from(newSel) });
      }
    } else {
      if (sel.includes(name)) {
        onChange({ ...data, selectedLocations: sel.filter((s) => s !== name) });
      } else {
        onChange({ ...data, selectedLocations: [...sel, name] });
      }
    }
  };

  const isSelected = (name: string, type: "continent" | "country") => {
    const sel = data.selectedLocations || [];
    if (type === "continent") {
      const countries = GEO_DATA.filter((g) => g.type === "country" && g.continent === name).map((g) => g.name);
      return countries.length > 0 && countries.every((c) => sel.includes(c));
    }
    return sel.includes(name);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Campaign name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Campaign name
        </label>
        <input
          value={data.name}
          onChange={(e) => onChange({ ...data, name: e.target.value })}
          placeholder="e.g. Summer 2026 promo"
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl text-foreground px-4 py-3 text-sm outline-none transition-colors focus:border-[#b5622a] placeholder:text-muted-foreground"
        />
      </div>

      {/* Select product */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Select a product
        </label>
        <div className="grid grid-cols-2 gap-3">
          {MOCK_PRODUCTS.map((p) => (
            <div
              key={p.id}
              onClick={() => onChange({ ...data, selectedProduct: p.id })}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                data.selectedProduct === p.id
                  ? "bg-[rgba(181,98,42,0.08)]"
                  : "bg-white/[0.03] border border-white/10"
              }`}
              style={
                data.selectedProduct === p.id
                  ? { border: "2px solid #b5622a" }
                  : {}
              }
            >
              <img
                src={p.image}
                alt={p.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {p.title}
                </p>
                <p className="text-xs text-muted-foreground">{p.price}</p>
                <p className="text-xs text-muted-foreground">{p.members}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target location */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Target location
        </label>

        <div
          onClick={() => onChange({ ...data, globalReach: !data.globalReach })}
          className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all mb-3 ${
            data.globalReach
              ? "bg-[rgba(181,98,42,0.08)]"
              : "bg-white/[0.03] border border-white/10"
          }`}
          style={data.globalReach ? { border: "2px solid #b5622a" } : {}}
        >
          <Globe className="w-5 h-5" style={{ color: "#b5622a" }} />
          <div>
            <span className="text-sm font-medium text-foreground">Global reach</span>
            <p className="text-xs text-muted-foreground">
              Show your ads to users worldwide
            </p>
          </div>
          <div
            className="ml-auto w-10 h-6 rounded-full transition-colors flex items-center"
            style={{
              background: data.globalReach ? "linear-gradient(90deg, #b5622a, #5c2a12)" : "rgba(255,255,255,0.1)",
              justifyContent: data.globalReach ? "flex-end" : "flex-start",
            }}
          >
            <div className="w-5 h-5 rounded-full bg-white mx-0.5 shadow" />
          </div>
        </div>

        {!data.globalReach && (
          <div className="space-y-3">
            {/* Location label */}
            <p className="text-sm font-medium text-foreground">Location</p>

            {/* Search bar with Include dropdown */}
            <div className="flex items-center border border-white/15 rounded-xl overflow-hidden bg-white/[0.03]">
              <button className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-muted-foreground border-r border-white/10 shrink-0">
                {includeMode === "include" ? "Include" : "Exclude"}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-center flex-1 px-3 gap-2">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search for continents or countries"
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2.5"
                />
              </div>
            </div>

            {/* Location list */}
            <div className="border border-white/15 rounded-xl max-h-[360px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {filtered.map((g, i) => {
                const selected = isSelected(g.name, g.type);
                return (
                  <div
                    key={`${g.type}-${g.name}-${i}`}
                    onClick={() => toggleLocation(g.name, g.type)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/[0.04] ${
                      g.type === "country" ? "pl-8" : ""
                    } ${i < filtered.length - 1 ? "border-b border-white/[0.05]" : ""}`}
                  >
                    <div
                      className={`w-4.5 h-4.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        selected
                          ? "border-[#b5622a] bg-[#b5622a]"
                          : "border-white/20 bg-transparent"
                      }`}
                      style={{ width: 18, height: 18 }}
                    >
                      {selected && <Check className="w-3 h-3 text-foreground" />}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {g.type === "continent" ? "Continent" : "Country"} –{" "}
                      <span className="text-foreground font-medium">{g.name}</span>
                    </span>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No locations found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
