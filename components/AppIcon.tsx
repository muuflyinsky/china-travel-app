"use client";
import { useEffect, useRef, useState } from "react";
import { APPS, appIconUrl, bundledIconUrl, type AppId } from "@/lib/apps";

/**
 * Real app icon, rounded like an iOS icon. The bundled copy (public/app-icons) shows at once; if it
 * is missing, /api/app-icon fetches it from the App Store (or draws the brand monogram).
 */
export function AppIcon({ id, size = 40, className = "" }: { id: AppId; size?: number; className?: string }) {
  const [src, setSrc] = useState(bundledIconUrl(id));
  const ref = useRef<HTMLImageElement>(null);
  const fallback = () => setSrc((s) => (s === appIconUrl(id) ? s : appIconUrl(id)));
  // The server-rendered <img> may fail before React attaches onError: check once after mount.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth === 0) fallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <img
      ref={ref}
      src={src}
      onError={fallback}
      alt={`${APPS[id].name} icon`}
      width={size}
      height={size}
      loading="lazy"
      className={`shrink-0 border border-line object-cover ${className}`}
      style={{ width: size, height: size, borderRadius: size * 0.225 }}
    />
  );
}
