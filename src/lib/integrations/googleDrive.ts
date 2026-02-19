/**
 * Modular Google Drive integration service.
 * Currently a stub — can be wired to a real Google Drive connector later.
 * Designed to be reused for images, videos, and exported docs.
 */

const DRIVE_CONNECTED_KEY = "yangu_gdrive_connected";

export function isDriveConnected(): boolean {
  return localStorage.getItem(DRIVE_CONNECTED_KEY) === "true";
}

export function setDriveConnected(connected: boolean) {
  localStorage.setItem(DRIVE_CONNECTED_KEY, connected ? "true" : "false");
}

/**
 * Upload a file (Blob or URL) to Google Drive.
 * Currently a stub that simulates success after a delay.
 * @returns {{ ok: boolean; fileName?: string; error?: string }}
 */
export async function uploadToDrive(opts: {
  fileUrl: string;
  fileName: string;
  folder?: string;
}): Promise<{ ok: boolean; fileName?: string; error?: string }> {
  // Stub: simulate upload delay
  await new Promise((r) => setTimeout(r, 1200));

  // In production, this would use the Google Drive connector gateway
  // const res = await fetch(`${GATEWAY_URL}/upload`, { ... });

  return {
    ok: true,
    fileName: opts.fileName,
  };
}
