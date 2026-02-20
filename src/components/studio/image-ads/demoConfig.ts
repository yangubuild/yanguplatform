/**
 * Temporary demo configuration for Image Ads.
 * Set isDemoMode = false when real AI providers are wired.
 */

export const isDemoMode = true;

export const DEMO_LINK =
  "https://www.amazon.com/Dokotoo-Pullover-Blouses-Sweatshirt-Fashion/dp/B0CFLQX8SW/ref=sr_1_39?crid=3V73CQLP8UMMM&dib=eyJ2IjoiMSJ9.ra-tvOpzZeHDU4sH-Rjeats60Q9mK0olJdK_Z9D9VoBtoi_7ppZ79pZX8_O3NdsRyDPaSRTHDUWFfy__Ln4SRj0C0O-MGHUhkrSeDzzdmMMj7fp81W6gXDioecupfGdD9QZY42ZnuUMSOv4vgiUz6hznx5HZ_LHI8v4GVwOtBUHNna8KnPu85X1nH7UOeWgCEDstFcuctc2Ply00esiRdS2TFTTmkSS4WdVaHgTcrPCste1wb3t228wHPIJDa_20uhfYHninSv_zyFEZRZ_yOIdkRQSYfxE9FcuNV5BtGixm65cwpBWLtPQ1DML-IWBd1JjgpaAv2tUHVrzCM2lMZaZRynF79c5mwj0wa9B34j3S_Qc6G02JMyS4t82rUBkwFwXctFcbsBxM-WzG5aIPcGXHWrRX84DzS5LNPsZxt4ciqiWWS_NENQEu-t7ApSDS._h_VP3a5Dndz95PzEP8YgRflswwEeMmBvjA5Xk5I6d8&dib_tag=se&keywords=Women%E2%80%99s+Fashion&qid=1734333214&sprefix=women+s+fashion%2Caps%2C575&sr=8-39";

export const DEMO_IMAGES = [
  "/studio/demo-product-1.jpg",
  "/studio/demo-product-2.jpg",
  "/studio/demo-product-3.jpg",
  "/studio/demo-product-4.jpg",
  "/studio/demo-product-5.jpg",
  "/studio/demo-product-6.jpg",
];

export const DEMO_PRODUCT = {
  brandName: "Dokotoo Women's Pullover",
  description:
    "Comfortable oversized pullover sweatshirt for women. Fashion blouse with a relaxed fit, perfect for casual everyday wear.",
  sellingPoints: [
    "Color block design",
    "Lightweight knit fabric",
    "Loose casual fit",
  ],
  brandColors: [
    "hsl(40, 20%, 75%)",
    "hsl(35, 55%, 55%)",
    "hsl(350, 15%, 60%)",
  ],
};

export function isDemoUrl(url: string): boolean {
  if (!isDemoMode) return false;
  // Match if the URL contains the same ASIN
  return url.includes("B0CFLQX8SW");
}
