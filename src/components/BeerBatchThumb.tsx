import { Beer } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeerBatchThumbProps {
  imageUrl?: string | null;
  loading?: boolean;
  alt?: string;
  size?: "sm" | "md";
  className?: string;
}

export function BeerBatchThumb({
  imageUrl,
  loading = false,
  alt = "Produto",
  size = "md",
  className,
}: BeerBatchThumbProps) {
  const dims = size === "sm" ? "h-9 w-9" : "h-10 w-10";

  if (loading) {
    return (
      <div
        className={cn(
          dims,
          "shrink-0 rounded-lg bg-muted animate-pulse border border-border/50",
          className,
        )}
        aria-hidden
      />
    );
  }

  if (!imageUrl) {
    return (
      <div
        className={cn(
          dims,
          "shrink-0 rounded-lg bg-muted flex items-center justify-center border border-border/50",
          className,
        )}
        aria-hidden
      >
        <Beer className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn(
        dims,
        "shrink-0 rounded-lg object-cover border border-border/50 bg-muted",
        className,
      )}
    />
  );
}
