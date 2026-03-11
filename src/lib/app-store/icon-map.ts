// Shared app icon map — used by App Store, My Apps, and Profile pages
import vlsIcon from "@/assets/app-icons/vls.jpg";
import visionboardIcon from "@/assets/app-icons/visionboard.jpg";
import visionaireIcon from "@/assets/app-icons/visionaire.jpg";
import foundawebIcon from "@/assets/app-icons/foundaweb.jpg";
import adaAiIcon from "@/assets/app-icons/ada-ai.jpg";
import yanguBadge from "@/assets/app-icons/yangu-badge.png";
import livestreamIcon from "@/assets/app-icons/yangu-livestream.png";
import studioIcon from "@/assets/app-icons/yangu-studio.png";
import youtubeIcon from "@/assets/app-icons/youtube.png";
import telegramIcon from "@/assets/app-icons/telegram.png";
import zoomIcon from "@/assets/app-icons/zoom.png";
import googleMeetIcon from "@/assets/app-icons/google-meet.png";
import gmailIcon from "@/assets/app-icons/gmail.png";
import googleDriveIcon from "@/assets/app-icons/google-drive.png";
import notionIcon from "@/assets/app-icons/notion.png";
import discordIcon from "@/assets/app-icons/discord.png";
import tasksIcon from "@/assets/app-icons/tasks.png";
import hrAppIcon from "@/assets/app-icons/hr-app.png";
import personalBudgetingIcon from "@/assets/app-icons/personal-budgeting.png";
import salesMarketingIcon from "@/assets/app-icons/sales-marketing.png";
import logoCreatorIcon from "@/assets/app-icons/logo-creator.png";
import paypalIcon from "@/assets/app-icons/paypal.png";
import stripeIcon from "@/assets/app-icons/stripe.png";

/** Maps slug → local icon asset */
export const ICON_MAP: Record<string, string> = {
  vls: vlsIcon,
  visionboard: visionboardIcon,
  visionaire: visionaireIcon,
  foundaweb: foundawebIcon,
  "ada-ai": adaAiIcon,
  "yangu-livestream": livestreamIcon,
  "yangu-studio": studioIcon,
  youtube: youtubeIcon,
  telegram: telegramIcon,
  zoom: zoomIcon,
  "google-meet": googleMeetIcon,
  gmail: gmailIcon,
  "google-drive": googleDriveIcon,
  notion: notionIcon,
  discord: discordIcon,
  tasks: tasksIcon,
  "hr-app": hrAppIcon,
  "personal-budgeting": personalBudgetingIcon,
  "sales-marketing": salesMarketingIcon,
  "logo-creator": logoCreatorIcon,
  paypal: paypalIcon,
  stripe: stripeIcon,
};

export { yanguBadge };
