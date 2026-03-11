/**
 * Extract Google Drive file ID from a download URL like:
 * https://drive.google.com/uc?export=download&id=FILE_ID
 */
export function extractDriveFileId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Generate a Google Drive thumbnail URL from a file ID.
 * Works for publicly shared files.
 */
export function getDriveThumbnailUrl(fileId: string, size = 800): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

/**
 * Get the best available thumbnail for a visionaire item.
 * Falls back to PDF-derived thumbnail if no cover image exists.
 */
export function getItemThumbnail(item: {
  thumbnail_url?: string | null;
  download_url?: string | null;
}): string | null {
  if (item.thumbnail_url) return item.thumbnail_url;
  const fileId = extractDriveFileId(item.download_url);
  if (fileId) return getDriveThumbnailUrl(fileId);
  return null;
}
