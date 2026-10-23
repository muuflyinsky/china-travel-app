"use client";
import { useEffect, useState } from "react";
import { Preloader } from "konsta/react";
import { Clock, Sun, Star, Ticket, CarTaxiFront, Flame, Leaf, ThumbsDown, ExternalLink, ReceiptText, Search, ChevronRight, CalendarClock } from "lucide-react";
import { Card, Group, Button, Seg } from "./ui";
import { AppIcon } from "./AppIcon";
import { ShowCard } from "./ShowCard";
import { ReservationSheet } from "./ReservationSheet";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";
import { goLink } from "@/lib/affiliate";
import { amapNav } from "@/lib/maplinks";
import { ALLERGENS, staffCardZh } from "@/lib/allergens";
import { RESERVATIONS } from "@/lib/reservations";
import { pick, type CityGuide as Guide, type GuideDish, type GuideSight } from "@/lib/city-guide-types";
import { AwardBadges } from "./AwardBadges";
import type { AwardRestaurant } from "@/lib/restaurant-awards";
import type { Place } from "@/lib/amap";

type Listed = AwardRestaurant & { poi: Place | null };
type Lists = Record<string, { name: string; edition: string; checked: string }>;

/** Restaurants on the Michelin / Black Pearl / Must-Eat lists. Hidden when we have no list for the city. */
function AwardRestaurants({ adcode, onPick }: { adcode: string; onPick: (p: Place | string) => void }) {
  const t = useT();
  const [p] = useProfile();
  const [d, setD] = useState<{ restaurants: Listed[]; lists: Lists; demo: boolean } | null>(null);
  useEffect(() => { setD(null); fetch(`/api/restaurants?city=${adcode}`).then((r) => r.json()).then(setD).catch(() => {}); }, [adcode]);
  if (!d?.restaurants.length) return null;
  const used = [...new Set(d.restaurants.flatMap((r) => r.awards.map((a) => a.list)))];
  const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(p.lang, { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
  return (
    <>
      <h3 className="mt-2 px-1 text-subhead font-semibold text-muted">{t.awards.title}</h3>
      <Group>
        {d.restaurants.map((r) => (
          <li key={r.zh}>
            <button onClick={() => onPick(r.poi ?? r.zh)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left">
              <span className="min-w-0 flex-1">
                <span className="zh block text-body">{r.zh}</span>
                {(r.en || r.cuisine) && <span className="block text-footnote text-muted">{[r.en, r.cuisine && <span key="c" className="zh">{r.cuisine}</span>].filter(Boolean).reduce<React.ReactNode[]>((a, x, i) => (i ? [...a, " · ", x] : [x]), [])}</span>}
                <AwardBadges awards={r.awards} />
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted opacity-60" aria-hidden />
            </button>
          </li>
        ))}
      </Group>
      <p className="px-1 text-footnote text-muted">
        {d.demo ? t.awards.sample : <>{used.map((l) => `${d.lists[l].name} ${d.lists[l].edition}${d.lists[l].checked ? ` (${fmt(t.awards.checked, { date: fmtDate(d.lists[l].checked) })})` : ""}`).join(" · ")}. {t.awards.note}</>}
      </p>
    </>
  );
}

type Tab = "see" | "eat";

/** Static pre-generated file first (CDN), then the API, which generates and caches. */
function useGuide(adcode: string) {
  const [g, setG] = useState<(Guide & { demo?: boolean }) | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "none">("loading");
  useEffect(() => {
    let alive = true;
    setG(null); setState("loading");
    (async () => {
      for (const url of [`/city-guide/${adcode}.json`, `/api/city-guide?city=${adcode}`]) {
        const r = await fetch(url).catch(() => null);
        if (r?.ok) { const d = await r.json(); if (alive) { setG(d); setState("ok"); } return; }
      }
      if (alive) setState("none");
    })();
    return () => { alive = false; };
  }, [adcode]);
  return { g, state };
}

function Feedback({ city, kind, name }: { city: string; kind: string; name: string }) {
  const t = useT();
  const [p] = useProfile();
  const [sent, setSent] = useState(false);
  useEffect(() => setSent(false), [name]);
  return sent ? <span className="text-footnote text-muted">{t.guide.thanks}</span> : (
    <button onClick={() => { setSent(true); fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ city, kind, name, lang: p.lang }) }).catch(() => {}); }}
      className="flex min-h-11 items-center gap-1 text-footnote text-muted"><ThumbsDown className="h-3.5 w-3.5" aria-hidden />{t.guide.notHelpful}</button>
  );
}

function SightCard({ s, city, cityEn, index }: { s: GuideSight; city: string; cityEn: string; index: number }) {
  const t = useT();
  const [p] = useProfile();
  const [card, setCard] = useState(false);
  const [resv, setResv] = useState(false);
  const r = s.reservation ? RESERVATIONS.find((x) => x.id === s.reservation) : undefined;
  const intro = s.confidence === "high" ? pick(s.intro, p.lang) : "";
  const best = s.confidence === "high" ? pick(s.bestTime, p.lang) : "";
  return (
    <Card>
      <h3 className="text-headline">{s.en}</h3>
      <p className="zh text-subhead text-muted">{s.zh}</p>
      {intro && <p className="mt-2 text-body">{intro}</p>}
      <ul className="mt-2 space-y-1 text-footnote text-muted">
        <li className="flex gap-1.5"><Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cobalt" aria-hidden />{fmt(t.guide.hours, { n: s.hours })}</li>
        {best && <li className="flex gap-1.5"><Sun className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cobalt" aria-hidden />{fmt(t.guide.best, { t: best })}</li>}
        {s.rating !== undefined && <li className="flex gap-1.5"><Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-current text-ink" aria-hidden />{s.rating.toFixed(1)}</li>}
      </ul>
      {r && (
        <button onClick={() => setResv(true)} className="mt-3 flex w-full items-center gap-2 rounded-2xl bg-warn-soft p-3 text-left text-subhead text-warn">
          <CalendarClock className="h-5 w-5 shrink-0" aria-hidden /><span className="flex-1">{t.guide.needsBooking}</span><ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      )}
      <a href={goLink("trip", "attraction", { keyword: s.en, city, cityEn }, "explore_sight", `explore-sight-${index + 1}`)} target="_blank" rel="noopener"
        className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cta px-4 text-headline text-cta-ink">
        <Ticket className="h-5 w-5" aria-hidden />{t.guide.tickets}<ExternalLink className="h-4 w-4" aria-hidden />
      </a>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button variant="soft" className="text-subhead!" onClick={() => setCard(true)}><CarTaxiFront className="h-5 w-5" aria-hidden />{t.guide.taxi}</Button>
        <a href={amapNav({ location: s.location, name: s.zh }, "bus")} target="_blank" rel="noopener" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cobalt-soft text-subhead font-semibold text-cobalt"><AppIcon id="amap" size={22} />{t.guide.route}</a>
      </div>
      <Feedback city={city} kind="sight" name={s.zh} />
      {card && <ShowCard lines={["师傅您好，请带我去：", s.zh, `地址：${s.address}`]} sub={s.en} onClose={() => setCard(false)} />}
      {r && <ReservationSheet r={r} open={resv} onClose={() => setResv(false)} />}
    </Card>
  );
}

function DishCard({ d, city, onFind }: { d: GuideDish; city: string; onFind: (zh: string) => void }) {
  const t = useT();
  const [p] = useProfile();
  const [card, setCard] = useState(false);
  const mine = d.allergens.filter((a) => p.allergens.includes(a));
  const zhOf = (id: string) => ALLERGENS.find((a) => a.id === id)?.zh.split("（")[0] ?? id;
  const lines = [
    "你好，我要点：",
    `${d.zh}${mine.length ? `（不要放${mine.map(zhOf).join("、")}）` : ""}`,
    ...(p.allergens.length || p.diets.length ? staffCardZh(p.allergens, p.diets, p.severe).slice(1, -1) : []),
  ];
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
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button className="text-subhead!" onClick={() => setCard(true)}><ReceiptText className="h-5 w-5" aria-hidden />{t.guide.orderCard}</Button>
        <Button variant="soft" className="text-subhead!" onClick={() => onFind(d.zh)}><Search className="h-5 w-5" aria-hidden />{t.guide.whereToEat}</Button>
      </div>
      <Feedback city={city} kind="dish" name={d.zh} />
      {card && <ShowCard lines={lines} explain={fmt(t.guide.orderExplain, { dish: pick(d.name, p.lang) })} onClose={() => setCard(false)} />}
    </Card>
  );
}

/** "See" and "Eat" picks for a city: the first one big, the rest as rows that swap into the card. */
export function CityGuide({ adcode, cityEn, initialTab = "see", onFindDish, onPickPlace }: {
  adcode: string; cityEn: string; initialTab?: Tab; onFindDish: (zh: string) => void; onPickPlace: (p: Place | string) => void;
}) {
  const t = useT();
  const [p] = useProfile();
  const { g, state } = useGuide(adcode);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sel, setSel] = useState(0);
  useEffect(() => setSel(0), [tab, adcode]);

  if (state === "loading") return <div className="flex justify-center py-6"><Preloader /></div>;
  const items = tab === "see" ? g?.sights ?? [] : g?.dishes ?? [];
  const city = g?.adcode ?? adcode;
  const updated = g && !g.demo ? new Date(g.generatedAt).toLocaleDateString(p.lang, { day: "numeric", month: "short", year: "numeric" }) : null;

  return (
    <>
      <Seg value={tab} onChange={setTab} label={fmt(t.guide.title, { city: cityEn })} options={[{ value: "see", label: t.guide.see }, { value: "eat", label: t.guide.eat }]} />
      {items.length === 0 ? (
        <p className="px-1 text-subhead text-muted">{state === "none" ? t.guide.notYet : t.guide.empty}</p>
      ) : (
        <>
          {tab === "see"
            ? <SightCard key={g!.sights[sel].id} s={g!.sights[sel]} city={city} cityEn={cityEn} index={sel} />
            : <DishCard key={g!.dishes[sel].zh} d={g!.dishes[sel]} city={city} onFind={onFindDish} />}
          <Group>
            {items.map((x, i) => i !== sel && (
              <li key={i}>
                <button onClick={() => setSel(i)} className="flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left">
                  <span className="w-5 shrink-0 text-footnote text-muted tabular-nums">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-body">{tab === "see" ? (x as GuideSight).en : pick((x as GuideDish).name, p.lang)}</span>
                    <span className="zh block text-footnote text-muted">{x.zh}</span>
                  </span>
                  {tab === "see" && (x as GuideSight).reservation && <CalendarClock className="h-4 w-4 shrink-0 text-warn" aria-label={t.guide.needsBooking} />}
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted opacity-60" aria-hidden />
                </button>
              </li>
            ))}
          </Group>
        </>
      )}
      {tab === "eat" && <AwardRestaurants adcode={adcode} onPick={onPickPlace} />}
      <a href={goLink("trip", "attraction", { cityEn }, "explore_top", "explore-top")} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-1 px-1 text-subhead font-semibold text-cobalt">
        {fmt(t.guide.topTrip, { city: cityEn })}<ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
      <p className="px-1 text-footnote text-muted">{t.guide.auto}{updated && ` · ${fmt(t.guide.updated, { date: updated })}`}</p>
    </>
  );
}
