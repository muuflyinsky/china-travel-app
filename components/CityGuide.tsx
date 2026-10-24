"use client";
import { useEffect, useState } from "react";
import { Preloader } from "konsta/react";
import { Clock, Sun, Star, Ticket, CarTaxiFront, Flame, Leaf, ExternalLink, ReceiptText, Search, ChevronRight, CalendarClock, RotateCw } from "lucide-react";
import { Card, Group, Button, Seg, Note } from "./ui";
import { SourceLine } from "./SourceLine";
import { Feedback } from "./Feedback";
import { AppIcon } from "./AppIcon";
import { ShowCard } from "./ShowCard";
import { ReservationSheet } from "./ReservationSheet";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";
import { goLink } from "@/lib/affiliate";
import { amapNav } from "@/lib/maplinks";
import { ALLERGENS, allergyLinesZh, blockedBySevere } from "@/lib/allergens";
import { track } from "@/lib/track";
import { RESERVATIONS } from "@/lib/reservations";
import { pick, type CityGuide as Guide, type GuideDish, type GuideSight } from "@/lib/city-guide-types";
import { Photo } from "./Photo";
import type { Place } from "@/lib/amap";

type Tab = "see" | "eat";

/** Static pre-generated file first (CDN), then the API, which generates and caches. */
export function useGuide(adcode: string) {
  const [g, setG] = useState<(Guide & { demo?: boolean }) | null>(null);
  // none: this city has no guide (not covered) · error: the request failed — never shown as "none".
  const [state, setState] = useState<"loading" | "ok" | "none" | "error">("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setG(null); setState("loading");
    (async () => {
      let failed = false;
      for (const url of [`/city-guide/${adcode}.json`, `/api/city-guide?city=${adcode}`]) {
        const r = await fetch(url).catch(() => null);
        if (r?.ok) { const d = await r.json().catch(() => null); if (d) { if (alive) { setG(d); setState("ok"); } return; } }
        // A 404 means "not here"; no response or a server error means we don't know.
        failed = !r || r.status >= 500 || r.ok;
      }
      if (alive) setState(failed ? "error" : "none");
    })();
    return () => { alive = false; };
  }, [adcode, attempt]);
  return { g, state, retry: () => setAttempt((n) => n + 1) };
}

function SightCard({ s, city, cityEn, index, version }: { s: GuideSight; city: string; cityEn: string; index: number; version: string }) {
  const t = useT();
  const [p] = useProfile();
  const [card, setCard] = useState(false);
  const [resv, setResv] = useState(false);
  const r = s.reservation ? RESERVATIONS.find((x) => x.id === s.reservation) : undefined;
  const intro = s.confidence === "high" ? pick(s.intro, p.lang) : "";
  const best = s.confidence === "high" ? pick(s.bestTime, p.lang) : "";
  return (
    <Card>
      <Photo src={s.photo} alt={s.en} className="mb-3" />
      <h3 className="text-headline">{s.en}</h3>
      <p className="zh text-subhead text-muted">{s.zh}</p>
      {intro && <p className="mt-2 text-body">{intro}</p>}
      <ul className="mt-2 space-y-1 text-footnote text-muted">
        {s.hours > 0 && <li className="flex gap-1.5"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cobalt" aria-hidden />{fmt(t.guide.hours, { n: s.hours })}</li>}
        {best && <li className="flex gap-1.5"><Sun className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cobalt" aria-hidden />{fmt(t.guide.best, { t: best })}</li>}
        {s.rating !== undefined && <li className="flex gap-1.5"><Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-current text-ink" aria-hidden />{s.rating.toFixed(1)}</li>}
      </ul>
      {r && (
        // Cobalt, not amber: amber is reserved for allergy cautions.
        <button onClick={() => setResv(true)} className="mt-3 flex w-full items-center gap-2 rounded-card bg-cobalt-soft p-3 text-left text-subhead text-cobalt">
          <CalendarClock className="h-5 w-5 shrink-0" aria-hidden /><span className="flex-1">{t.guide.needsBooking}</span><ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      )}
      <a href={goLink("trip", "attraction", { keyword: s.en, city, cityEn }, "explore_sight", `explore-sight-${index + 1}`)} target="_blank" rel="noopener"
        className="mt-3 flex min-h-control items-center justify-center gap-2 rounded-control bg-cta px-4 text-headline text-cta-ink">
        <Ticket className="h-5 w-5" aria-hidden />{t.guide.tickets}<ExternalLink className="h-4 w-4" aria-hidden />
      </a>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="soft" className="text-subhead!" onClick={() => { setCard(true); track("taxi_card_shown", { source: "guide" }); }}><CarTaxiFront className="h-5 w-5" aria-hidden />{t.guide.taxi}</Button>
        <a href={amapNav({ location: s.location, name: s.zh }, "bus")} target="_blank" rel="noopener" className="flex min-h-control items-center justify-center gap-2 rounded-control bg-cobalt-soft text-subhead font-semibold text-cobalt"><AppIcon id="amap" size={22} />{t.guide.route}</a>
      </div>
      <Feedback kind="sight" id={s.id} version={version} city={city} />
      {card && <ShowCard kind="taxi" lines={["师傅您好，请带我去：", s.zh, `地址：${s.address}`]} sub={s.en} onClose={() => setCard(false)} />}
      {r && <ReservationSheet r={r} open={resv} onClose={() => setResv(false)} />}
    </Card>
  );
}

function DishCard({ d, city, onFind, version }: { d: GuideDish; city: string; onFind: (zh: string) => void; version: string }) {
  const t = useT();
  const [p] = useProfile();
  const [card, setCard] = useState(false);
  const mine = d.allergens.filter((a) => p.allergens.includes(a));
  const zhOf = (id: string) => ALLERGENS.find((a) => a.id === id)?.zh.split("（")[0] ?? id;
  // No ingredient roles for guide dishes: blockedBySevere treats every allergen as a main ingredient.
  const blocked = blockedBySevere(d, p.severe.filter((a) => p.allergens.includes(a)));
  const { severe, rest } = allergyLinesZh(p.allergens, p.diets, p.severe);
  const lines = ["您好，我要点：", `${d.zh}${mine.length ? `（不要放${mine.map(zhOf).join("、")}）` : ""}`];
  return (
    <Card tone={mine.length ? "danger" : "plain"}>
      <h3 className="text-headline">{pick(d.name, p.lang)}</h3>
      <p className="text-subhead text-muted"><span className="zh">{d.zh}</span> {d.pinyin}</p>
      {d.confidence === "high" && <p className="mt-2 text-body">{pick(d.intro, p.lang)}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {d.allergens.map((a) => <span key={a} className={`tag ${p.allergens.includes(a) ? "tag-danger" : ""}`}>{t.allergens[a as keyof typeof t.allergens] ?? a}</span>)}
        {d.vegetarian && <span className="tag"><Leaf className="h-3.5 w-3.5" aria-hidden />{t.eat.vegetarian}</span>}
        {d.spice > 0 && <span className="tag" aria-label={fmt(t.eat.spice, { n: d.spice })}>{Array.from({ length: d.spice }, (_, i) => <Flame key={i} className="h-3.5 w-3.5" aria-hidden />)}</span>}
      </div>
      {d.spend && <p className="mt-2 text-footnote text-muted">{fmt(t.guide.spend, { range: `¥${d.spend[0]}–${d.spend[1]}` })}</p>}
      {blocked.length > 0 && (
        <p className="mt-3 rounded-control border border-danger px-3 py-2.5 text-subhead font-semibold text-danger" role="note">
          {fmt(t.eat.blockedSevere, { x: blocked.map((a) => (t.allergens[a as keyof typeof t.allergens] ?? a).toLowerCase()).join(", ") })}
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {blocked.length === 0 && <Button className="text-subhead!" onClick={() => { setCard(true); track("order_card_shown", { dishes: 1, source: "guide" }); }}><ReceiptText className="h-5 w-5" aria-hidden />{t.guide.orderCard}</Button>}
        <Button variant="soft" className="text-subhead!" onClick={() => onFind(d.zh)}><Search className="h-5 w-5" aria-hidden />{t.guide.whereToEat}</Button>
      </div>
      <Feedback kind="guide_dish" id={d.zh} version={version} city={city} />
      {card && <ShowCard kind="order" lead={severe || undefined} lines={lines} rest={rest} explain={fmt(t.guide.orderExplain, { dish: pick(d.name, p.lang) })}
        replies={[{ zh: "可以，没问题", mine: t.eat.replyOk }, { zh: "这道菜做不了", mine: t.eat.replyCant }, ...(p.allergens.length ? [{ zh: "里面有您过敏的东西", mine: t.eat.replyContainsAny }] : [])]}
        onClose={() => setCard(false)} />}
    </Card>
  );
}

/** "See" and "Eat" picks for a city: the first one big, the rest as rows that swap into the card. */
export type GuideTab = Tab;

export function CityGuide({ adcode, cityEn, initialTab = "see", tab: controlled, onFindDish, onRestaurants }: {
  adcode: string; cityEn: string; initialTab?: Tab;
  /** Set by a parent that shows its own See/Eat switch (Explore's filter row); hides the built-in one. */
  tab?: Tab;
  onFindDish: (zh: string) => void;
  /** No dishes yet (they need the model): offer the restaurant list instead of a dead end. */
  onRestaurants?: () => void;
}) {
  const t = useT();
  const [p] = useProfile();
  const { g, state, retry } = useGuide(adcode);
  const [own, setTab] = useState<Tab>(initialTab);
  const tab = controlled ?? own;
  const [sel, setSel] = useState(0);
  useEffect(() => setSel(0), [tab, adcode]);

  if (state === "loading") return <div className="flex justify-center py-6"><Preloader /></div>;
  if (state === "error") {
    return (
      <>
        <Note tone="warn">{t.guide.loadError}</Note>
        <Button variant="soft" className="w-full text-subhead!" onClick={retry}><RotateCw className="h-4 w-4" aria-hidden />{t.common.retry}</Button>
      </>
    );
  }
  const items = tab === "see" ? g?.sights ?? [] : g?.dishes ?? [];
  const city = g?.adcode ?? adcode;

  return (
    <>
      {!controlled && <Seg value={tab} onChange={setTab} label={fmt(t.guide.title, { city: cityEn })} options={[{ value: "see", label: t.guide.see }, { value: "eat", label: t.guide.eat }]} />}
      {items.length === 0 ? (
        // Dishes need the model; restaurants have their own view in Explore now.
        <>
          <p className="px-1 text-subhead text-muted">{state === "none" ? t.guide.notYet : t.guide.empty}</p>
          {tab === "eat" && onRestaurants && <Button variant="soft" className="w-full text-subhead!" onClick={onRestaurants}>{fmt(t.awards.eatEntry, { city: cityEn })}</Button>}
        </>
      ) : (
        <>
          {tab === "see"
            ? <SightCard key={g!.sights[sel].id} s={g!.sights[sel]} city={city} cityEn={cityEn} index={sel} version={g!.generatedAt} />
            : <DishCard key={g!.dishes[sel].zh} d={g!.dishes[sel]} city={city} onFind={onFindDish} version={g!.generatedAt} />}
          <Group>
            {items.map((x, i) => i !== sel && (
              <li key={i}>
                <button onClick={() => setSel(i)} className="flex min-h-control w-full items-center gap-3 px-4 py-2 text-left">
                  {tab === "see" && (x as GuideSight).photo
                    ? <Photo src={(x as GuideSight).photo} alt="" shape="square" />
                    : <span className="w-5 shrink-0 text-footnote text-muted tabular-nums">{i + 1}</span>}
                  <span className="min-w-0 flex-1">
                    <span className="block text-body">{tab === "see" ? (x as GuideSight).en : pick((x as GuideDish).name, p.lang)}</span>
                    <span className="zh block text-footnote text-muted">{x.zh}</span>
                  </span>
                  {tab === "see" && (x as GuideSight).reservation && <CalendarClock className="h-4 w-4 shrink-0 text-cobalt" aria-label={t.guide.needsBooking} />}
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted opacity-60" aria-hidden />
                </button>
              </li>
            ))}
          </Group>
        </>
      )}
      <a href={goLink("trip", "attraction", { cityEn }, "explore_top", "explore-top")} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-1 px-1 text-subhead font-semibold text-cobalt">
        {fmt(t.guide.topTrip, { city: cityEn })}<ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
      {/* Map data alone is sourced; anything with model-written text says so. */}
      {g && <SourceLine ai={!(g as { partial?: boolean }).partial} name="Amap" date={g.demo ? undefined : g.generatedAt} />}
    </>
  );
}
