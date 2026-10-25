"use client";
import { Bird, Beef, CakeSlice, ChefHat, Coffee, CookingPot, Croissant, Drumstick, Fish, Flame, Landmark, Leaf, Pizza, Salad, Sandwich, Shell, Shrimp, Soup, Sparkles, UtensilsCrossed, Wheat, Wine } from "lucide-react";
import type { CuisineInfo } from "@/lib/cuisines";

const ICONS = { Bird, Beef, CakeSlice, ChefHat, Coffee, CookingPot, Croissant, Drumstick, Fish, Flame, Landmark, Leaf, Pizza, Salad, Sandwich, Shell, Shrimp, Soup, Sparkles, UtensilsCrossed, Wheat, Wine };

/**
 * Stand-in for a restaurant with no usable Amap photo: the cuisine's tone, icon and name. Never
 * an image from anywhere else. Square for the list (96 px), wide (16:9) for the detail page.
 */
export function CuisineTile({ c, shape = "square" }: { c?: CuisineInfo; shape?: "square" | "wide" }) {
  const Icon = ICONS[(c?.icon ?? "UtensilsCrossed") as keyof typeof ICONS] ?? UtensilsCrossed;
  const box = shape === "wide" ? "aspect-video w-full rounded-control gap-2" : "h-24 w-24 rounded-control gap-1.5 px-1.5";
  return (
    <span className={`grid shrink-0 place-content-center justify-items-center text-center tone-${c?.tone ?? 6} ${box}`} aria-hidden={!c} role={c ? "img" : undefined} aria-label={c?.short}>
      <Icon className={shape === "wide" ? "h-10 w-10" : "h-7 w-7"} aria-hidden strokeWidth={1.6} />
      {c && <span className={`${shape === "wide" ? "text-headline" : "line-clamp-2 text-footnote"} font-semibold leading-tight`}>{c.short}</span>}
    </span>
  );
}
