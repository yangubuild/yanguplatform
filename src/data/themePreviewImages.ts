// Static imports for theme preview images
import newYear from "@/assets/themes/new-year.jpg";
import admire from "@/assets/themes/admire.jpg";
import balance from "@/assets/themes/balance.jpg";
import bloom from "@/assets/themes/bloom.jpg";
import boldTech from "@/assets/themes/bold-tech.jpg";
import boldWords from "@/assets/themes/bold-words.jpg";
import border from "@/assets/themes/border.jpg";
import bubbles from "@/assets/themes/bubbles.jpg";
import care from "@/assets/themes/care.jpg";
import carousels from "@/assets/themes/carousels.jpg";
import chapter from "@/assets/themes/chapter.jpg";
import christmas from "@/assets/themes/christmas.jpg";
import classic from "@/assets/themes/classic.jpg";
import coffee from "@/assets/themes/coffee.jpg";
import cyber from "@/assets/themes/cyber.jpg";
import dashed from "@/assets/themes/dashed.jpg";
import easter from "@/assets/themes/easter.jpg";
import elegance from "@/assets/themes/elegance.jpg";
import era from "@/assets/themes/era.jpg";
import fonts from "@/assets/themes/fonts.jpg";
import freshPop from "@/assets/themes/fresh-pop.jpg";
import influencer from "@/assets/themes/influencer.jpg";
import influencerCaptions from "@/assets/themes/influencer-captions.jpg";
import interfaceTheme from "@/assets/themes/interface.jpg";
import meme from "@/assets/themes/meme.jpg";
import minimalist from "@/assets/themes/minimalist.jpg";
import modern from "@/assets/themes/modern.jpg";
import natural from "@/assets/themes/natural.jpg";
import notes from "@/assets/themes/notes.jpg";
import picnic from "@/assets/themes/picnic.jpg";
import plus from "@/assets/themes/plus.jpg";
import pride from "@/assets/themes/pride.jpg";
import refine from "@/assets/themes/refine.jpg";
import save from "@/assets/themes/save.jpg";
import simplyImage from "@/assets/themes/simply-image.jpg";
import sleek from "@/assets/themes/sleek.jpg";
import spice from "@/assets/themes/spice.jpg";
import spooky from "@/assets/themes/spooky.jpg";
import stPatricks from "@/assets/themes/st-patricks.jpg";
import stardust from "@/assets/themes/stardust.jpg";
import striking from "@/assets/themes/striking.jpg";
import threads from "@/assets/themes/threads.jpg";
import ticket from "@/assets/themes/ticket.jpg";
import triad from "@/assets/themes/triad.jpg";
import tropical from "@/assets/themes/tropical.jpg";
import tweet from "@/assets/themes/tweet.jpg";
import voyage from "@/assets/themes/voyage.jpg";
import webinar from "@/assets/themes/webinar.jpg";
import wilderness from "@/assets/themes/wilderness.jpg";

export const THEME_PREVIEW_IMAGES: Record<string, string> = {
  "new-year": newYear,
  admire,
  balance,
  bloom,
  "bold-tech": boldTech,
  "bold-words": boldWords,
  border,
  bubbles,
  care,
  carousels,
  chapter,
  christmas,
  classic,
  coffee,
  cyber,
  dashed,
  easter,
  elegance,
  era,
  fonts,
  "fresh-pop": freshPop,
  influencer,
  "influencer-captions": influencerCaptions,
  interface: interfaceTheme,
  meme,
  minimalist,
  modern,
  natural,
  notes,
  picnic,
  plus,
  pride,
  refine,
  save,
  "simply-image": simplyImage,
  sleek,
  spice,
  spooky,
  "st-patricks": stPatricks,
  stardust,
  striking,
  threads,
  ticket,
  triad,
  tropical,
  tweet,
  voyage,
  webinar,
  wilderness,
};

export function getThemePreviewImage(themeKey: string): string | null {
  return THEME_PREVIEW_IMAGES[themeKey] || null;
}
