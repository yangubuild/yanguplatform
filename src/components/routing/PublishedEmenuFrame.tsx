import { useEffect } from "react";

interface PublishedEmenuFrameProps {
  html: string;
  title: string;
}

/**
 * Renders a published Emenu page by writing the full HTML document directly
 * into the current page. No iframe — the published HTML IS the page.
 */
export function PublishedEmenuFrame({ html, title }: PublishedEmenuFrameProps) {
  // Replace the entire document with the published HTML
  useEffect(() => {
    if (!html) return;

    // Set the document title before replacing the page
    document.title = title;

    // Write the full emenu HTML directly — replaces the entire React app
    // This is intentional: the published page IS the final output
    try {
      document.open();
      document.write(html);
      document.close();
    } catch {
      // Fallback: inject into body if document.write fails
      document.documentElement.innerHTML = html;
    }
  }, [html, title]);

  // Render a loading state that will be replaced by document.write
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}