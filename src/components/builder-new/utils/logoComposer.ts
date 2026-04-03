const ICON_171406 = new URL("../../../assets/logos/emenu/food-icon-171406.png", import.meta.url).href;
const ICON_5807 = new URL("../../../assets/logos/emenu/food-icon-5807.png", import.meta.url).href;
const ICON_6211 = new URL("../../../assets/logos/emenu/food-icon-6211.png", import.meta.url).href;

type LogoLayout =
  | "wordmark-left"
  | "stacked-center"
  | "compact-inline"
  | "editorial-balance"
  | "underline-brand"
  | "signature-inline";

interface ComposeLogoOptions {
  businessName: string;
  color: string;
  description?: string;
  seed?: number;
}

interface LogoPlan {
  iconSrc: string;
  layout: LogoLayout;
}

const ICONS = [ICON_171406, ICON_5807, ICON_6211];

const LAYOUTS: LogoLayout[] = [
  "wordmark-left",
  "stacked-center",
  "compact-inline",
  "editorial-balance",
  "underline-brand",
  "signature-inline",
];

function rotate<T>(items: T[], seed = 0): T[] {
  if (items.length === 0) return items;
  const offset = ((seed % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scale = Math.min(width / img.width, height / img.height);
  const drawWidth = img.width * scale;
  const drawHeight = img.height * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  weight = 800,
) {
  let size = startSize;
  while (size > 44) {
    ctx.font = `${weight} ${size}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 4;
  }
  return 44;
}

function getDescriptor(description?: string) {
  if (!description?.trim()) return "";
  return description
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ")
    .toUpperCase();
}

async function composeSingleLogo({
  businessName,
  color,
  description,
  iconSrc,
  layout,
}: ComposeLogoOptions & LogoPlan): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 560;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const icon = await loadImage(iconSrc);
  const title = businessName.trim() || "My Business";
  const descriptor = getDescriptor(description);
  const ink = color || "#152A20";
  const neutral = "#223127";
  const subtle = "#6B7280";

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "alphabetic";
  ctx.imageSmoothingEnabled = true;

  const drawDescriptor = (x: number, y: number, align: CanvasTextAlign = "left") => {
    if (!descriptor) return;
    ctx.textAlign = align;
    ctx.fillStyle = subtle;
    ctx.font = '600 26px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(descriptor, x, y);
  };

  switch (layout) {
    case "wordmark-left": {
      drawContain(ctx, icon, 84, 132, 230, 230);
      drawDescriptor(382, 176);
      const fontSize = fitFontSize(ctx, title, 900, 126);
      ctx.fillStyle = ink;
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(title, 382, 292);
      ctx.fillStyle = ink;
      ctx.fillRect(382, 332, Math.min(ctx.measureText(title).width, 260), 8);
      break;
    }
    case "stacked-center": {
      drawContain(ctx, icon, 510, 60, 380, 220);
      drawDescriptor(700, 334, "center");
      const fontSize = fitFontSize(ctx, title, 1120, 118);
      ctx.fillStyle = neutral;
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(title, 700, 428);
      ctx.fillStyle = ink;
      ctx.fillRect(560, 462, 280, 6);
      break;
    }
    case "compact-inline": {
      drawContain(ctx, icon, 96, 186, 150, 150);
      drawDescriptor(296, 214);
      const fontSize = fitFontSize(ctx, title, 940, 108);
      ctx.fillStyle = ink;
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(title, 296, 314);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(296, 350);
      ctx.lineTo(1120, 350);
      ctx.stroke();
      break;
    }
    case "editorial-balance": {
      drawContain(ctx, icon, 930, 92, 220, 220);
      drawDescriptor(112, 208);
      const fontSize = fitFontSize(ctx, title, 760, 122);
      ctx.fillStyle = neutral;
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(title, 112, 332);
      ctx.fillStyle = ink;
      ctx.beginPath();
      ctx.arc(1006, 360, 10, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "underline-brand": {
      drawContain(ctx, icon, 94, 122, 210, 210);
      drawDescriptor(94, 390);
      const fontSize = fitFontSize(ctx, title, 1180, 114);
      ctx.fillStyle = ink;
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(title, 94, 484);
      ctx.fillRect(94, 514, 340, 8);
      break;
    }
    case "signature-inline": {
      drawContain(ctx, icon, 92, 164, 180, 180);
      drawDescriptor(328, 232);
      const fontSize = fitFontSize(ctx, title, 930, 112);
      ctx.fillStyle = neutral;
      ctx.font = `800 ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.textAlign = "left";
      ctx.fillText(title, 328, 332);
      ctx.fillStyle = ink;
      ctx.fillRect(328, 366, 120, 8);
      break;
    }
  }

  return canvas.toDataURL("image/png");
}

export async function composeLogoOptions({
  businessName,
  color,
  description,
  seed = 0,
}: ComposeLogoOptions): Promise<string[]> {
  const iconOrder = rotate(ICONS, seed);
  const layoutOrder = rotate(LAYOUTS, seed);

  const plans: LogoPlan[] = [0, 1, 2].map((index) => ({
    iconSrc: iconOrder[index % iconOrder.length],
    layout: layoutOrder[index],
  }));

  return Promise.all(
    plans.map((plan) =>
      composeSingleLogo({
        businessName,
        color,
        description,
        seed,
        ...plan,
      }),
    ),
  );
}