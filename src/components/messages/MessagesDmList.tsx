import { useState } from "react";
import { Search, PenSquare } from "lucide-react";

interface DmThread {
  id: string;
  name: string;
  preview: string;
  date: string;
  badge?: string;
  avatarInitials?: string;
}

const MOCK_THREADS: DmThread[] = [
  {
    id: "team-yangu",
    name: "Team yangu",
    preview: "welcome to yangu! Thousands of internet..",
    date: "12/3",
    badge: "🍊",
    avatarInitials: "TY",
  },
];

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MessagesDmList({ selectedId, onSelect }: Props) {
  const [filter, setFilter] = useState<"unread" | "requests">("unread");
  const [search, setSearch] = useState("");

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 flex items-center gap-2">
        <div
          className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <Search className="w-4 h-4" style={{ color: "rgba(255,255,255,0.35)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="bg-transparent text-sm flex-1 outline-none"
            style={{ color: "rgba(255,255,255,0.8)" }}
          />
        </div>
        <button
          className="p-2 rounded-lg hover:opacity-80"
          style={{ color: "rgba(255,255,255,0.5)" }}
        >
          <PenSquare className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-3 pb-2">
        {(["unread", "requests"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors"
            style={
              filter === t
                ? { background: "rgba(255,255,255,0.1)", color: "#fff" }
                : { color: "rgba(255,255,255,0.45)" }
            }
          >
            {t === "unread" ? "Unread" : "Requests"}
          </button>
        ))}
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto px-2">
        {MOCK_THREADS.map((thread) => (
          <button
            key={thread.id}
            onClick={() => onSelect(thread.id)}
            className="w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors"
            style={
              selectedId === thread.id
                ? { background: "rgba(255,255,255,0.08)" }
                : {}
            }
          >
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
            >
              {thread.avatarInitials}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-white truncate">{thread.name}</span>
                {thread.badge && <span className="text-xs">{thread.badge}</span>}
                <span className="ml-auto text-[11px] shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {thread.date}
                </span>
              </div>
              <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                {thread.preview}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
