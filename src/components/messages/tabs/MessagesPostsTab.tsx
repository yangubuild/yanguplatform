export function MessagesPostsTab() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6">
      {/* Skeleton post card */}
      <div
        className="w-full max-w-lg rounded-xl p-5"
        style={{ background: "rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-28 rounded" style={{ background: "rgba(255,255,255,0.1)" }} />
            <div className="h-2 w-20 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="h-3 w-4/5 rounded" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="h-3 w-3/5 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>
      </div>

      <p className="text-sm mt-2 text-muted-foreground">
        Looks like there aren't any posts yet.
      </p>
      <p className="text-xs text-muted-foreground">
        Be the first one to make a post!
      </p>
    </div>
  );
}
