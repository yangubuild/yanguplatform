import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleApi } from "@/hooks/useGoogleApi";
import { ArrowLeft, Search, FileText, Image, Film, FolderOpen, RefreshCw, ExternalLink, Loader2, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const fetchingRef = useRef(false);

  const fetchFiles = useCallback(async (query?: string, pageToken?: string) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setFetching(true);
    try {
      const params: Record<string, unknown> = { pageSize: 30 };
      if (query) params.query = `name contains '${query}'`;
      if (pageToken) params.pageToken = pageToken;
      const result = await callApi<{ files: DriveFile[]; nextPageToken?: string }>("drive/files", params);
      if (result) {
        clearError();
        const nextFiles = Array.isArray(result.files) ? result.files : [];
        if (pageToken) {
          setFiles((prev) => [...prev, ...nextFiles]);
        } else {
          setFiles(nextFiles);
        }
        setNextPageToken(result.nextPageToken || null);
      }
    } finally {
      setHasLoaded(true);
      setFetching(false);
      fetchingRef.current = false;
    }
  }, [callApi, clearError]);

  useEffect(() => {
    if (user?.id && !hasLoaded) {
      void fetchFiles();
    }
  }, [user?.id, hasLoaded, fetchFiles]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFiles(searchQuery);
  };

  const handleImport = (file: DriveFile) => {
    if (file.webViewLink) {
      navigator.clipboard.writeText(file.webViewLink);
      toast.success(`Link copied for "${file.name}"`, { description: "Paste it in any builder or upload field." });
    }
  };

  return (
    <div className="w-full min-h-screen px-6 py-6 bg-background">
      <button
        onClick={() => navigate("/dashboard/my-apps")}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to My Apps
      </button>

      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Google Drive</h1>
            <p className="text-sm text-muted-foreground mt-1">Browse and import files into YANGU</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchFiles(searchQuery)}
            disabled={fetching}>
            <RefreshCw className={`w-4 h-4 ${fetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </form>

        {error && !hasLoaded && (
          <div className="rounded-lg p-4 mb-4 text-sm text-red-300 bg-red-500/10 border border-red-500/20">
            {error}
          </div>
        )}

        {/* Files list */}
        {fetching && !hasLoaded ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        ) : files.length === 0 && hasLoaded ? (
          <div className="text-center py-20">
            <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No files found</p>
          </div>
        ) : (
          <div className="rounded-xl bg-card border border-border divide-y divide-border">
            {files.map((file) => {
              const Icon = getFileIcon(file.mimeType);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors group first:rounded-t-xl last:rounded-b-xl">
                  {file.thumbnailLink ? (
                    <img src={file.thumbnailLink} alt="" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(file.modifiedTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {file.size ? ` · ${formatFileSize(file.size)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleImport(file)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Copy link for import">
                      <Download className="w-4 h-4" />
                    </button>
                    {file.webViewLink && (
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Open in Google Drive">
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
            <Button
              variant="outline"
              size="default"
              onClick={() => fetchFiles(searchQuery, nextPageToken)}
              disabled={fetching}>
              {fetching ? "Loading..." : "Load more"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
