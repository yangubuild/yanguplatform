export type SelectedScope = "none" | "page" | "section" | "text" | "button" | "image" | "menu" | "form";
export type ActivePopup = null | "link" | "color" | "typography" | "alignment" | "ada" | "customStyle";

export type LinkTargetType = "web" | "page" | "section" | "document" | "email" | "phone" | "popup" | "scroll" | "whatsapp" | "address";

export interface LinkData {
  type: LinkTargetType;
  value: string;
  openInNewTab: boolean;
}
