"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Clock, MapPin, Plus, ReceiptText, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import { Card, Group } from "./ui";
import { Photo } from "./Photo";
import { CuisineTile } from "./CuisineTile";
import { AwardBadges } from "./AwardBadges";
import { ShowCard } from "./ShowCard";
import { VerdictTag } from "./VerdictTag";
import { usePerPerson } from "./AwardRestaurants";
import { useProfile } from "./useProfile";
import { useCity } from "./useCity";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";
import { cuisineInfo } from "@/lib/cuisines";
import { formatHours } from "@/lib/hours";
import { verdict } from "@/lib/verdict";
import { orderCard } from "@/lib/order-card";
import { track } from "@/lib/track";
import type { ListedRestaurant } from "@/lib/restaurants";
import type { ListDish, MenuEvent } from "@/lib/dishes";

/**
 * Signature dishes through the menu pipeline (/api/menu with typed names): dish knowledge base
 * first, generated and cached on a miss, under the same confidence rules. Nothing when the AI
 * is unavailable or answers with sample data: we never show made-up dishes for a real restaurant.
 */
function useSignatureDishes(names: string[], lang: string, city: { e: string; n: string; p: string; a: string }) {
  const [dishes, setDishes] = useState<(ListDish | undefined)[] | null>(null);
  const key = names.join("\n");
  useEffect(() => {
    if (!key) { setDishes(null); return; }
    const ctl = new AbortController();
    setDishes(names.map(() => undefined));
    (async () => {
      const r = await fetch("/api/menu", {
        method: "POST", signal: ctl.signal, headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: key, lang, city: `${city.e} (${city.n}, ${city.p})`, adcode: city.a }),
      });
      if (!r.ok || !r.body) throw new Error(String(r.status));
      const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "", got: (ListDish | undefined)[] = names.map(() => undefined);
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const l of lines) {
          if (!l.trim()) continue;
          const ev = JSON.parse(l) as MenuEvent | { type: "demo" | "error" | "done" };
          if (ev.type === "demo") { ctl.abort(); setDishes(null); return; }
          if (ev.type === "dish") { got = [...got]; got[ev.i] = ev.dish; setDishes(got); }
        }
      }
      // Dishes that never arrived are dropped rather than left as placeholders.
      setDishes(got.filter(Boolean).length ? got.filter(Boolean) : null);
    })().catch(() => { if (!ctl.signal.aborted) setDishes(null); });
    return () => ctl.abort();
  }, [key, lang, city.a]); // eslint-disable-line react-hooks/exhaustive-deps
  return dishes;
}

/** Swipeable Amap photos, each credited; no photo: the cuisine tile, never another source's image. */
function Photos({ photos, alt, c }: { photos: string[]; alt: string; c: ReturnType<typeof cuisineInfo> }) {
  const t = useT();
  const [i, setI] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  if (!photos.length) return <CuisineTile c={c} shape="wide" />;
  return (
    <div className="relative">
      <div ref={strip} className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-control [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => { const el = e.currentTarget; setI(Math.round(el.scrollLeft / Math.max(1, el.clientWidth))); }}>
        {photos.map((src, k) => (
          <div key={src} className="w-full shrink-0 snap-center">
            <Photo src={src} alt={k === 0 ? alt : ""} />
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5" role="tablist" aria-label={fmt(t.awards.photoOf, { i: i + 1, n: photos.length })}>
          {photos.map((src, k) => (
            <button key={src} role="tab" aria-selected={k === i} aria-label={fmt(t.awards.photoOf, { i: k + 1, n: photos.length })}
              onClick={() => strip.current?.scrollTo({ left: k * strip.current.clientWidth, behavior: "smooth" })}
              className="grid h-6 w-6 place-items-center">
              <span className={`block h-2 w-2 rounded-full ${k === i ? "bg-cobalt" : "bg-line"}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Restaurant detail, in this order: photos → signature dishes → price, hours, address →
 * route and taxi card (`children`, from Explore) → where the award comes from.
 */
export function RestaurantDetail({ r, aiOn = true, children }: { r: ListedRestaurant; aiOn?: boolean; children?: React.ReactNode }) {
  const t = useT();
  const [p] = useProfile();
  const { city } = useCity();
  const perPerson = usePerPerson();
  const c = cuisineInfo(r.cuisineKey, p.lang);
  const dishes = useSignatureDishes(aiOn ? r.dishes : [], p.lang, city);
  const [order, setOrder] = useState<Record<string, string[]>>({}); // dish zh → ingredients to leave out
  const [card, setCard] = useState<ReturnType<typeof orderCard> | null>(null);
  const restrictions = { allergens: p.allergens, diets: p.diets, severe: p.severe.filter((a) => p.allergens.includes(a)) };
  const restricted = restrictions.allergens.length + restrictions.diets.length > 0;
  const hours = formatHours(r.opentime, p.lang, { daily: t.awards.daily, closed: t.awards.closed });
  const ordered = (dishes ?? []).filter((d): d is ListDish => Boolean(d && order[d.zh]));
  const editions = [...new Set(r.awards.map((a) => `${a.list === "michelin" ? "MICHELIN Guide" : a.list === "black_pearl" ? "Black Pearl" : "Dianping Must-Eat"} ${a.edition}`))];

  return (
    <>
      <Card>
        <Photos photos={r.photos} alt={r.zh} c={c} />
        <h2 className="zh mt-3 text-title" lang="zh-CN">{r.zh}</h2>
        <p className="text-subhead text-muted">{[r.nameEn, c?.short].filter(Boolean).join(" · ")}</p>
        <AwardBadges awards={r.awards} />
        {c && <p className="mt-2 text-subhead">{c.about}</p>}
      </Card>

      {dishes && dishes.length > 0 && (
        <>
          <h3 className="mt-2 px-1 text-subhead font-semibold text-muted">{t.awards.signature}</h3>
          <Group>
            {dishes.map((d, k) => {
              if (!d) return <li key={k} className="h-20 animate-pulse" aria-hidden />;
              const v = verdict(d, restrictions);
              const added = Boolean(order[d.zh]);
              return (
                <li key={d.zh} className="flex items-start gap-3 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-semibold">{d.name}</span>
                    <span className="block text-footnote text-muted"><span className="zh" lang="zh-CN">{d.zh}</span> {d.pinyin}</span>
                    <span className="block text-subhead">{d.short}</span>
                    {restricted && <span className="mt-1 block"><VerdictTag v={v} /></span>}
                  </span>
                  {v.blocked.length ? (
                    <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-danger" aria-label={t.eat.verdictNo} />
                  ) : (
                    <button aria-pressed={added}
                      onClick={() => setOrder((o) => { const n = { ...o }; if (added) delete n[d.zh]; else n[d.zh] = v.removable.map((a) => a.via_zh).filter(Boolean); return n; })}
                      className={`flex min-h-11 shrink-0 items-center gap-1 rounded-control px-3 text-subhead font-semibold ${added ? "bg-cobalt-soft text-cobalt" : "text-cobalt"}`}>
                      {added ? <Check className="h-4 w-4" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}{added ? t.awards.added : t.awards.orderThis}
                    </button>
                  )}
                </li>
              );
            })}
          </Group>
          {ordered.length > 0 && (
            <button onClick={() => { track("order_card_shown", { dishes: ordered.length, source: "restaurant" }); setCard(orderCard(t, restrictions, ordered.map((d) => ({ zh: d.zh, name: d.name, qty: 1, without: order[d.zh] })))); }}
              className="flex min-h-control w-full items-center justify-center gap-2 rounded-control bg-cobalt text-subhead font-semibold text-white dark:text-[#12141c]">
              <ReceiptText className="h-5 w-5" aria-hidden />{fmt(t.eat.orderBar, { n: ordered.length })}
            </button>
          )}
          <p className="flex items-start gap-1.5 px-1 text-footnote text-muted"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{t.awards.signatureNote}</p>
        </>
      )}

      <Group>
        {r.cost ? <Info icon={<Wallet className="h-5 w-5" aria-hidden />} label={t.awards.perPersonLabel}><span className="tabular-nums">{perPerson(r.cost)}</span></Info> : null}
        {r.opentime && (
          <Info icon={<Clock className="h-5 w-5" aria-hidden />} label={t.awards.hours}>
            {hours ?? <span className="zh" lang="zh-CN">{r.opentime}</span>}
          </Info>
        )}
        {r.poi?.address && (
          <Info icon={<MapPin className="h-5 w-5" aria-hidden />} label={t.awards.address}>
            <span className="zh" lang="zh-CN">{r.poi.address}</span>
          </Info>
        )}
      </Group>

      {children}

      <div className="space-y-1">
        <p className="px-1 text-footnote text-muted">{t.awards.listedIn} {editions.join(" · ")}</p>
        <p className="px-1 text-footnote text-muted">{t.awards.note}</p>
      </div>
      {card && <ShowCard {...card} onClose={() => setCard(null)} />}
    </>
  );
}

function Info({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <span className="mt-0.5 text-muted">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-footnote text-muted">{label}</span>
        <span className="block text-body">{children}</span>
      </span>
    </li>
  );
}
