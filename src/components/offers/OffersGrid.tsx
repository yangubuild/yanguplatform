import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart, MessageCircle, Share2, MoreHorizontal, ChevronDown, ChevronUp,
  Search, Maximize2, ExternalLink, Smile, Sticker, Image as ImageIcon,
  ThumbsUp, Reply, Trash2, Pencil,
} from "lucide-react";
import yanguYIcon from "@/assets/yangu-y-icon.png";

import offer01 from "@/assets/offers/offer-01.jpg";
import offer02 from "@/assets/offers/offer-02.jpg";
import offer03 from "@/assets/offers/offer-03.jpg";
import offer04 from "@/assets/offers/offer-04.jpg";
import offer05 from "@/assets/offers/offer-05.jpg";
import offer06 from "@/assets/offers/offer-06.jpg";
import offer07 from "@/assets/offers/offer-07.jpg";
import offer08 from "@/assets/offers/offer-08.jpg";
import offer09 from "@/assets/offers/offer-09.jpg";
import offer10 from "@/assets/offers/offer-10.jpg";

interface Tile {
  id: string;
  image: string;
  title: string;
  description: string;
  ownerType: "yangu" | "user";
  ownerName: string;
  ownerAvatar: string;
  loveCount: number;
  commentCount: number;
  destinationUrl: string;
}

const TILES: Tile[] = [
  { id: "1", image: offer01, title: "Chips Product Poster Design", description: "Snack advertisement design for a chips brand — Ideal for fo...", ownerType: "yangu", ownerName: "yangu", ownerAvatar: "", loveCount: 9, commentCount: 1, destinationUrl: "/dashboard/seller/eshop-connect" },
  { id: "2", image: offer02, title: "Green Phone Launch", description: "Smartphone launch creative", ownerType: "yangu", ownerName: "yangu", ownerAvatar: "", loveCount: 5, commentCount: 0, destinationUrl: "/dashboard/seller/eshop-connect" },
  { id: "3", image: offer03, title: "African Queen Campaign", description: "Beauty brand visual campaign", ownerType: "yangu", ownerName: "yangu", ownerAvatar: "", loveCount: 12, commentCount: 2, destinationUrl: "/dashboard/seller/eshop-connect" },
  { id: "4", image: offer04, title: "Play Bold Kids", description: "Children's brand creative poster", ownerType: "yangu", ownerName: "yangu", ownerAvatar: "", loveCount: 7, commentCount: 0, destinationUrl: "/dashboard/seller/eshop-connect" },
  { id: "5", image: offer05, title: "Wednesday Special", description: "Midweek promotional offer", ownerType: "yangu", ownerName: "yangu", ownerAvatar: "", loveCount: 3, commentCount: 0, destinationUrl: "/dashboard/seller/eshop-connect" },
  { id: "6", image: offer06, title: "Social Fix Campaign", description: "Social media marketing ad", ownerType: "yangu", ownerName: "yangu", ownerAvatar: "", loveCount: 8, commentCount: 1, destinationUrl: "/dashboard/seller/eshop-connect" },
  { id: "7", image: offer07, title: "Fresh Crops Living", description: "Healthy living brand creative", ownerType: "yangu", ownerName: "yangu", ownerAvatar: "", loveCount: 4, commentCount: 0, destinationUrl: "/dashboard/seller/eshop-connect" },
  { id: "8", image: offer08, title: "Potato Chips Arabic", description: "Arabic snack brand poster", ownerType: "yangu", ownerName: "yangu", ownerAvatar: "", loveCount: 6, commentCount: 0, destinationUrl: "/dashboard/seller/eshop-connect" },
  { id: "9", image: offer09, title: "Black Weeks Sale", description: "Season sale promotional design", ownerType: "yangu", ownerName: "yangu", ownerAvatar: "", loveCount: 11, commentCount: 3, destinationUrl: "/dashboard/seller/eshop-connect" },
  { id: "10", image: offer10, title: "Official Launch", description: "Product launch creative", ownerType: "yangu", ownerName: "yangu", ownerAvatar: "", loveCount: 2, commentCount: 0, destinationUrl: "/dashboard/seller/eshop-connect" },
];

const MASONRY_HEIGHTS = [
  "210px", "210px", "260px",
  "260px", "260px", "280px",
  "310px", "260px", "280px",
];

// --- Placeholder comments for demo ---
interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
  loveCount: number;
  likeCount: number;
}
const DEMO_COMMENTS: Record<string, Comment[]> = {
  "1": [{ id: "c1", author: "yangu", avatar: "", text: "great artwork", time: "Just now", loveCount: 0, likeCount: 0 }],
  "3": [
    { id: "c2", author: "yangu", avatar: "", text: "Beautiful design!", time: "2h ago", loveCount: 1, likeCount: 0 },
    { id: "c3", author: "yangu", avatar: "", text: "Love the colors", time: "1h ago", loveCount: 0, likeCount: 2 },
  ],
  "6": [{ id: "c4", author: "yangu", avatar: "", text: "This is fire 🔥", time: "5m ago", loveCount: 3, likeCount: 1 }],
  "9": [
    { id: "c5", author: "yangu", avatar: "", text: "Great deals!", time: "1d ago", loveCount: 0, likeCount: 0 },
    { id: "c6", author: "yangu", avatar: "", text: "When does this end?", time: "12h ago", loveCount: 0, likeCount: 1 },
    { id: "c7", author: "yangu", avatar: "", text: "Amazing sale", time: "3h ago", loveCount: 2, likeCount: 0 },
  ],
};

// 3-dots menu items
const DOTS_MENU_ITEMS = [
  "Download image",
  "See more like this",
  "See less like this",
  "Report Pin",
  "Get Pin embed code",
];

export function OffersGrid() {
  const navigate = useNavigate();
  const [featuredIdx, setFeaturedIdx] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState<Record<string, Comment[]>>(DEMO_COMMENTS);
  const [dotsOpen, setDotsOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const featured = TILES[featuredIdx];
  const grid = TILES.filter((_, i) => i !== featuredIdx);
  const comments = localComments[featured.id] || [];

  const handlePostComment = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: `new-${Date.now()}`,
      author: "yangu",
      avatar: "",
      text: commentText.trim(),
      time: "Just now",
      loveCount: 0,
      likeCount: 0,
    };
    setLocalComments((prev) => ({
      ...prev,
      [featured.id]: [...(prev[featured.id] || []), newComment],
    }));
    setCommentText("");
    // Collapse after posting
    setTimeout(() => setCommentsOpen(false), 600);
  };

  const handleVisitSite = () => {
    navigate(featured.destinationUrl);
  };

  const handleGetOffer = () => {
    navigate(featured.destinationUrl);
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 sm:px-6 lg:px-10">
      <div className="flex gap-4">
        {/* ── LEFT: Featured Pin ── */}
        <div className="w-full max-w-[480px] shrink-0">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-foreground" />
                <span className="text-sm font-semibold text-foreground">{featured.loveCount}</span>
                <button onClick={() => setCommentsOpen(!commentsOpen)} className="ml-2 flex items-center gap-1">
                  <MessageCircle className="h-5 w-5 text-foreground" />
                  <span className="text-sm text-foreground">{comments.length}</span>
                </button>
                <Share2 className="h-5 w-5 text-foreground ml-2 cursor-pointer" />
                <div className="relative ml-2">
                  <button onClick={() => setDotsOpen(!dotsOpen)}>
                    <MoreHorizontal className="h-5 w-5 text-foreground" />
                  </button>
                  {dotsOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setDotsOpen(false)} />
                      <div className="absolute left-0 top-8 z-50 w-52 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                        {DOTS_MENU_ITEMS.map((item) => (
                          <button
                            key={item}
                            onClick={() => setDotsOpen(false)}
                            className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-white/[0.06] transition-colors">
                            {item}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">Profile</span>
                <ChevronDown className="h-4 w-4 text-foreground" />
                <button
                  onClick={handleGetOffer}
                  className="ml-2 rounded-lg px-4 py-1.5 text-sm font-bold text-foreground"
                  style={{ background: "linear-gradient(135deg, #b5622a, #5c2a12)" }}>
                  Get Offer
                </button>
              </div>
            </div>

            {/* Main image */}
            <div className="relative">
              <img
                src={featured.image}
                alt={featured.title}
                className="w-full object-cover"
                style={{ maxHeight: "560px" }}
              />
              {/* Bottom-left: Visit site */}
              <button
                onClick={handleVisitSite}
                className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-black shadow">
                <ExternalLink className="h-3.5 w-3.5" />
                Visit site
              </button>
              {/* Bottom-right: Search + Enlarge */}
              <div className="absolute bottom-3 right-3 flex flex-col gap-2">
                <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors">
                  <Maximize2 className="h-4 w-4 text-black" />
                </button>
                <button
                  onClick={() => setLightboxOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition-colors">
                  <Search className="h-4 w-4 text-black" />
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">{featured.title}</h2>
                <button
                  onClick={handleVisitSite}
                  className="rounded-lg border border-border px-4 py-1.5 text-sm font-semibold text-foreground hover:bg-white/[0.04] transition-colors">
                  Visit site
                </button>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {featured.description}
                <span className="ml-1 font-semibold text-foreground cursor-pointer">... more</span>
              </p>
              {/* Owner row */}
              <div className="mt-3 flex items-center gap-2">
                <img
                  src={featured.ownerType === "yangu" ? yanguYIcon : (featured.ownerAvatar || yanguYIcon)}
                  alt={featured.ownerName}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <span className="text-sm font-semibold text-foreground">{featured.ownerName}</span>
              </div>
              {/* Comments toggle */}
              <button
                onClick={() => setCommentsOpen(!commentsOpen)}
                className="mt-3 flex items-center gap-1 text-sm text-foreground cursor-pointer">
                <span>{comments.length} Comment{comments.length !== 1 ? "s" : ""}</span>
                {commentsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {/* Expanded comments section */}
              {commentsOpen && (
                <div className="mt-3 border-t border-border pt-3 space-y-3">
                  {comments.length === 0 && (
                    <p className="text-sm font-semibold text-foreground">No comments yet</p>
                  )}
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2">
                      <img src={c.avatar || yanguYIcon} alt={c.author} className="h-7 w-7 rounded-full object-cover mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-semibold text-foreground">{c.author}</span>{" "}
                          <span className="text-foreground">{c.text}</span>
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{c.time}</span>
                          <button className="font-semibold text-foreground hover:underline">Reply</button>
                          <Heart className="h-3.5 w-3.5 text-muted-foreground cursor-pointer hover:text-red-400" />
                          <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Comment input */}
                  <div className="flex items-center gap-2 rounded-full border border-border px-4 py-2 mt-2">
                    <input
                      type="text"
                      placeholder={comments.length === 0 ? "Add a comment to start the conversation" : "Add a comment"}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                    <div className="flex items-center gap-2 text-foreground">
                      <Smile className="h-5 w-5 cursor-pointer" />
                      <Sticker className="h-5 w-5 cursor-pointer" />
                      <ImageIcon className="h-5 w-5 cursor-pointer" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: 3-column masonry grid ── */}
        <div className="flex-1 min-w-0">
          <div className="columns-3 gap-3">
            {grid.map((tile, i) => (
              <button
                key={tile.id}
                type="button"
                onClick={() => {
                  const realIdx = TILES.findIndex((t) => t.id === tile.id);
                  setFeaturedIdx(realIdx);
                  setCommentsOpen(false);
                  setDotsOpen(false);
                }}
                className="mb-3 block w-full overflow-hidden rounded-xl transition-transform duration-200 hover:scale-[1.02] focus-visible:outline-none break-inside-avoid">
                <img
                  src={tile.image}
                  alt={tile.title}
                  className="w-full object-cover rounded-xl"
                  style={{ height: MASONRY_HEIGHTS[i % MASONRY_HEIGHTS.length] }}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80" onClick={() => setLightboxOpen(false)}>
          <img
            src={featured.image}
            alt={featured.title}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
          />
        </div>
      )}
    </div>
  );
}
