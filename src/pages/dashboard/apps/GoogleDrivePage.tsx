import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleApi } from "@/hooks/useGoogleApi";
import { ArrowLeft, Search, FileText, Image, Film, FolderOpen, RefreshCw, ExternalLink, Loader2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  iconLink?: string;
};

const MIME_ICONS: Record<string, typeof FileText> = {
  "application/pdf": FileText,
  "image/": Image,
  "video/": Film,
};

function getFileIcon(mimeType: string) {
  if (mimeType.includes("folder")) return FolderOpen;
  for (const [key, Icon] of Object.entries(MIME_ICONS)) {
    if (mimeType.startsWith(key)) return Icon;
  }
  return FileText;
}

function formatFileSize(bytes?: string) {
  if (!bytes) return "";
  const n = parseInt(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function GoogleDrivePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { callApi, loading, error, clearError } = useGoogleApi();
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchFiles = useCallback(async (query?: string, pageToken?: string) => {
    if (fetching) return;
    setFetching(true);
    const params: Record<string, unknown> = { pageSize: 30 };
    if (query) params.query = `name contains '${query}'`;
    if (pageToken) params.pageToken = pageToken;

    const result = await callApi<{ files: DriveFile[]; nextPageToken?: string }>("drive/files", params);
    if (result) {
      clearError();
      if (pageToken) {
        setFiles(prev => [...prev, ...(result.files || [])]);
      } else {
        setFiles(result.files || []);
      }
      setNextPageToken(result.nextPageToken || null);
    }
    setHasLoaded(true);
    setFetching(false);
  }, [callApi, clearError, fetching]);

  useEffect(() => {
    if (user?.id && !hasLoaded) fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles(searchQuery);
  };

  const handleImport = (file: DriveFile) => {
    // Copy the Drive file link to clipboard for use in builders
    if (file.webViewLink) {
      navigator.clipboard.writeText(file.webViewLink);
      toast.success(`Link copied for "${file.name}"`, { description: "Paste it in any builder or upload field." });
    }
  };

  return (
    <div className="w-full min-h-screen px-6 py-6" style={{ background: "#08120D" }}>
      <button
        onClick={() => navigate("/dashboard/my-apps")}
        className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Apps
      </button>

      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-white">Google Drive</h1>
            <p className="text-sm text-white/40 mt-1">Browse and import files into YANGU</p>
          </div>
          <button
            onClick={() => fetchFiles(searchQuery)}
            disabled={fetching}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white transition-colors"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
        </form>

        {/* Error - only show real errors, not empty-state false positives */}
        {error && !hasLoaded && (
          <div className="rounded-xl p-4 mb-4 text-sm text-red-300" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}

        {/* Files list */}
        {fetching && !hasLoaded ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        ) : files.length === 0 && hasLoaded ? (
          <div className="text-center py-20">
            <FolderOpen className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p className="text-white/30 text-sm">No files found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((file) => {
              const Icon = getFileIcon(file.mimeType);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
                >
                  {file.thumbnailLink ? (
                    <img src={file.thumbnailLink} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <Icon className="w-4 h-4 text-white/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{file.name}</p>
                    <p className="text-[11px] text-white/30">
                      {new Date(file.modifiedTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {file.size ? ` · ${formatFileSize(file.size)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleImport(file)}
                      className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                      title="Copy link for import"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        title="Open in Google Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load more */}
        {nextPageToken && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => fetchFiles(searchQuery, nextPageToken)}
              disabled={fetching}
              className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white transition-colors"
              style={{ background: "rgba(255,255,255,0.06)" }}
            >
              {fetching ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
