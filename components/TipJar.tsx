"use client";
import { useEffect, useState } from "react";
import { Coffee, Soup, UtensilsCrossed } from "lucide-react";
import { Note } from "./ui";
import { useT } from "./useT";
import { TIPS } from "@/lib/products";
import { buy, products, type StoreProduct } from "@/lib/passes";

/** Tips through Apple in-app purchase (consumables). They unlock nothing. */
export function TipJar() {
  const t = useT();
  const [items, setItems] = useState<StoreProduct[] | "loading" | "error">("loading");
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<"thanks" | "failed" | null>(null);
  useEffect(() => { products(TIPS).then((p) => setItems(p.length ? p : "error"), () => setItems("error")); }, []);

  const names = [t.pass.tipSmall, t.pass.tipMedium, t.pass.tipLarge];
  const icons = [Coffee, Soup, UtensilsCrossed];
  async function tip(id: string) {
    setBusy(id); setDone(null);
    const r = await buy(id);
    setBusy(null);
    if (r.status === "purchased") setDone("thanks");
    else if (r.status === "failed") setDone("failed");
  }

  return (
    <>
      <p className="px-1 text-body">{t.pass.tipsBody}</p>
      {items === "loading" && <p className="px-1 text-subhead text-muted">{t.pass.loading}</p>}
      {items === "error" && <Note tone="warn">{t.pass.unavailable}</Note>}
      {Array.isArray(items) && (
        <div className="grid grid-cols-3 gap-3">
          {TIPS.map((id, i) => {
            const sp = items.find((x) => x.id === id);
            const Icon = icons[i];
            return sp && (
              <button key={id} onClick={() => tip(id)} disabled={busy !== null}
                className="flex flex-col items-center gap-1 rounded-card border border-line bg-card px-2 py-4 disabled:opacity-60">
                <Icon className="h-6 w-6 text-cobalt" aria-hidden />
                <span className="text-subhead">{names[i]}</span>
                <span className="text-headline text-cobalt">{busy === id ? "…" : sp.displayPrice}</span>
              </button>
            );
          })}
        </div>
      )}
      {done === "thanks" && <Note>{t.pass.tipThanks}</Note>}
      {done === "failed" && <Note tone="warn">{t.pass.failed}</Note>}
    </>
  );
}
