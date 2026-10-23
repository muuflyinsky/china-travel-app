"use client";
import { useState } from "react";
import { useT } from "./useT";

/**
 * An Amap place photo: 16:9 for the big card, square for list thumbnails. Credited in the
 * corner (Amap's terms ask for attribution). Hidden if the image fails to load.
 */
export function Photo({ src, alt, shape = "wide", className = "" }: { src?: string; alt: string; shape?: "wide" | "square"; className?: string }) {
  const t = useT();
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    <span className={`relative block shrink-0 overflow-hidden bg-line ${shape === "wide" ? "aspect-video rounded-2xl" : "h-12 w-12 rounded-xl"} ${className}`}>
      {/* Remote images from Amap's CDN: plain <img>, not next/image (no remote patterns needed, no proxying). */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      {shape === "wide" && <span className="absolute right-2 bottom-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] leading-4 text-white">{t.go.photoBy}</span>}
    </span>
  );
}
