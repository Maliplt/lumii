import type { ImgHTMLAttributes } from "react";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** ilk ekran görselleri */
  priority?: boolean;
}

// görseller varsayılan olarak lazy yüklenir
export default function OptimizedImage({
  priority = false,
  loading,
  decoding = "async",
  fetchPriority,
  ...imageProps
}: OptimizedImageProps) {
  return (
    <img
      {...imageProps}
      loading={loading ?? (priority ? "eager" : "lazy")}
      decoding={decoding}
      fetchPriority={fetchPriority ?? (priority ? "high" : "auto")}
    />
  );
}
