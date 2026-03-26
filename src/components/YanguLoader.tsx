interface YanguLoaderProps {
  /** Size of the loader icon in pixels (default: 40) */
  size?: number;
  /** Optional label below the icon */
  label?: string;
  /** Fill the parent container with centered loader */
  fullArea?: boolean;
}

const YANGU_LOADER_SRC = "/yangu-y-loader.png";

export function YanguLoader({ size = 40, label, fullArea = true }: YanguLoaderProps) {
  const img = (
    <img
      src={YANGU_LOADER_SRC}
      alt="Loading"
      width={size}
      height={size}
      className="animate-spin"
      style={{ animationDuration: "1.4s", animationTimingFunction: "linear" }}
    />
  );

  if (!fullArea) {
    return (
      <div className="flex flex-col items-center gap-2">
        {img}
        {label && <p className="text-xs text-muted-foreground">{label}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[200px]">
      {img}
      {label && <p className="text-xs text-muted-foreground mt-2">{label}</p>}
    </div>
  );
}
