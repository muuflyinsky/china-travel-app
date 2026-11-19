"use client";
import Link from "next/link";
import { Info } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui";
import { useT } from "./useT";
import { openApp } from "@/lib/openApp";
import type { AppId } from "@/lib/apps";

const NOTED = ["didi", "amap", "alipay", "wechat"] as const;
type Noted = (typeof NOTED)[number];

/**
 * Inside the iOS app we never send people to the App Store (App Review 3.2.2(i), D19). When an app
 * isn't installed, this note under the button says what to do instead, with our own fallback.
 * `driverHref`: where the driver card is, when it isn't already on screen.
 */
export function AppMissing({ app, driverHref }: { app: AppId | null; driverHref?: string }) {
  const t = useT();
  if (!app || !(NOTED as readonly string[]).includes(app)) return null;
  const a = app as Noted;
  const action = a === "didi" && driverHref ? <Link href={driverHref} className="font-semibold text-cobalt">{t.inapp.driverCard}</Link>
    : a === "amap" ? <Link href="/explore" className="font-semibold text-cobalt">{t.inapp.seeRoute}</Link> : null;
  return (
    <p role="status" className="flex gap-2 rounded-card border border-line bg-card p-3 text-subhead">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" aria-hidden />
      <span className="min-w-0 flex-1">{t.inapp.missing[a]}{action && <span className="mt-1 block">{action}</span>}</span>
    </p>
  );
}

/** "Open DiDi" as a full-width button, with the note when DiDi isn't on the phone (airport page). */
export function DidiButton({ label, onOpen, driverHref }: { label: string; onOpen?: () => void; driverHref?: string }) {
  const [missing, setMissing] = useState<AppId | null>(null);
  return (
    <>
      <Button variant="soft" onClick={() => { setMissing(null); openApp("didi", undefined, setMissing); onOpen?.(); }} className="w-full text-subhead!">{label}</Button>
      <AppMissing app={missing} driverHref={driverHref} />
    </>
  );
}
