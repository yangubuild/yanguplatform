import { supabase } from "@/integrations/supabase/client";

function isValidHexColor(color: string): boolean {
  return /^#([0-9a-f]{6})$/i.test(color.trim());
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Failed to read recolored logo"));
    };
    reader.onerror = () => reject(new Error("Failed to read recolored logo"));
    reader.readAsDataURL(blob);
  });
}

function loadImage(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load logo image"));
    image.src = objectUrl;
  });
}

export async function recolorLogoToBlob(sourceUrl: string, color: string): Promise<Blob> {
  if (!sourceUrl) throw new Error("Logo source is required");

  const normalizedColor = color.trim();
  if (!isValidHexColor(normalizedColor)) {
    throw new Error("Invalid logo color");
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error("Failed to fetch selected logo");
  }

  const sourceBlob = await response.blob();
  const objectUrl = URL.createObjectURL(sourceBlob);

  try {
    const image = await loadImage(objectUrl);
    const width = Math.max(1, image.naturalWidth || image.width);
    const height = Math.max(1, image.naturalHeight || image.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not available");

    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    context.globalCompositeOperation = "source-in";
    context.fillStyle = normalizedColor;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = "source-over";

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }
        reject(new Error("Failed to encode recolored logo"));
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function recolorLogoToDataUrl(sourceUrl: string, color: string): Promise<string> {
  const recoloredBlob = await recolorLogoToBlob(sourceUrl, color);
  return blobToDataUrl(recoloredBlob);
}

export async function saveRecoloredLogo(sourceUrl: string, color: string): Promise<{ url: string; storagePath: string }> {
  const recoloredBlob = await recolorLogoToBlob(sourceUrl, color);
  const { data: userResult, error: userError } = await supabase.auth.getUser();

  if (userError || !userResult.user) {
    throw new Error("Auth required to save selected logo");
  }

  const storagePath = `${userResult.user.id}/logos/${Date.now()}-${crypto.randomUUID()}-selected-logo.png`;
  const { error: uploadError } = await supabase.storage
    .from("builder-media")
    .upload(storagePath, recoloredBlob, { contentType: "image/png", upsert: false });

  if (uploadError) throw uploadError;

  const { data: publicData } = supabase.storage.from("builder-media").getPublicUrl(storagePath);
  return { url: publicData.publicUrl, storagePath };
}
