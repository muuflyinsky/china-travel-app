"use client";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { useT } from "./useT";

/**
 * An Amap place photo: 16:9 for the big card, square for list thumbnails. Credited in the
 * corner (Amap's terms ask for attribution). No photo at all: nothing. A photo that fails to
 * load keeps its space with a quiet placeholder, so cards and rows don't jump.
 */
export function Photo({ src, alt, shape = "wide", className = "" }: { src?: string; alt: string; shape?: "wide" | "square"; className?: string }) {
  const t = useT();
  const [failed, setFailed] = useState(false);
  if (!src) return null;
  const box = `relative block shrink-0 overflow-hidden bg-line ${shape === "wide" ? "aspect-video rounded-control" : "h-12 w-12 rounded-control"} ${className}`;
  if (failed) {
    return (
      <span className={`${box} grid place-items-center text-muted`} role="img" aria-label={alt || undefined}>
        <ImageOff className={shape === "wide" ? "h-6 w-6" : "h-4 w-4"} aria-hidden />
      </span>
    );
  }
  return (
    <span className={box}>
      {/* Remote images from Amap's CDN: plain <img>, not next/image (no remote patterns needed, no proxying). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      {shape === "wide" && <span className="absolute right-2 bottom-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] leading-4 text-white">{t.go.photoBy}</span>}
    </span>
  );
}
