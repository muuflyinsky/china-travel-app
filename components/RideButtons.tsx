"use client";
import { useState } from "react";
import { AppIcon } from "./AppIcon";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { amapNav } from "@/lib/maplinks";
import { openApp } from "@/lib/openApp";
import { track } from "@/lib/track";

/**
 * Book a ride (SPEC v0.5 P1.6 #24). Amap takes the destination and opens route planning, where
 * the traveller taps 打车; DiDi has no public deep link with a destination, so we copy the
 * Chinese address and open the app. The traveller's default app (Settings) comes first.
 */
export function RideButtons({ to, address }: { to: { location: string; name: string }; address: string }) {
  const t = useT();
  const [p] = useProfile();
  const [copied, setCopied] = useState(false);
  const amap = (
    <a key="amap" href={amapNav(to, "car")} target="_blank" rel="noopener" onClick={() => track("app_open", { app: "amap", source: "ride" })}
      className="flex min-h-control flex-1 items-center justify-center gap-2 rounded-control border border-line bg-card px-3 text-subhead font-semibold">
      <AppIcon id="amap" size={24} />{t.go.rideAmap}
    </a>
  );
  const didi = (
    <button key="didi" onClick={() => { navigator.clipboard?.writeText(`${to.name} ${address}`).then(() => setCopied(true)).catch(() => {}); openApp("didi"); }}
      className="flex min-h-control flex-1 items-center justify-center gap-2 rounded-control border border-line bg-card px-3 text-subhead font-semibold">
      <AppIcon id="didi" size={24} />{t.go.rideDidi}
    </button>
  );
  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">{p.rideApp === "didi" ? [didi, amap] : [amap, didi]}</div>
      <p className="px-1 text-footnote text-muted" role={copied ? "status" : undefined}>{copied ? t.go.didiCopied : p.rideApp === "didi" ? t.today.didiHint : t.go.amapRideHint}</p>
    </div>
  );
}
