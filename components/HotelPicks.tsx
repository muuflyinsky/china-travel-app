"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Star, TrainFront, ShieldCheck } from "lucide-react";
import { Card } from "./ui";
import { AppIcon } from "./AppIcon";
import { useProfile } from "./useProfile";
import { useFx, formatMoney } from "./useFx";
import { useT } from "./useT";
import { goLink, type LinkParams } from "@/lib/affiliate";
import { amapNav } from "@/lib/maplinks";
import { fmt } from "@/lib/i18n";
import { track } from "@/lib/track";
import type { CityPicks, HotelPick } from "@/lib/hotel-tiers";

export type PicksResponse = CityPicks & { bounds: [number, number, number]; demo: boolean };

/** Hotel picks for a city (adcode + short Chinese name), from /api/hotels. */
export function useHotelPicks(adcode: string, name: string, around?: string) {
  const [data, setData] = useState<PicksResponse | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    setData(null); setError(false);
    fetch(`/api/hotels?${new URLSearchParams({ city: adcode, name, ...(around ? { around } : {}) })}`)
      .then((r) => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setError(true));
  }, [adcode, name, around]);
  return { data, error };
}

/** "¥520 ≈ €66" in the traveller's currency. */
export function usePrice() {
  const [p] = useProfile();
  const fx = useFx(p.homeCurrency);
  return (cny: number) => {
    const home = fx && p.homeCurrency !== "CNY" ? ` ≈ ${formatMoney(cny / fx.value, p.homeCurrency, p.lang)}` : "";
    return `¥${cny.toLocaleString(p.lang)}${home}`;
  };
}

function Facts({ h }: { h: HotelPick }) {
  const t = useT();
  return (
    <ul className="mt-2 space-y-1 text-footnote text-muted">
      <li className="flex gap-1.5"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cobalt" aria-hidden />
        {h.chain ? t.stay.foreignChain : fmt(t.stay.foreignStar, { n: h.stars })}
      </li>
      <li className="flex gap-1.5"><TrainFront className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cobalt" aria-hidden />
        {h.metro ? <span>{fmt(t.stay.metro, { m: h.metro.meters })} · <span className="zh">{h.metro.name}站</span></span> : t.stay.noMetro}
      </li>
      {h.rating !== undefined && <li className="flex gap-1.5"><Star className="mt-0.5 h-3.5 w-3.5 shrink-0 fill-current text-ink" aria-hidden />{h.rating.toFixed(1)}</li>}
    </ul>
  );
}

/** The one featured hotel of a tier. Carries the page's only gold button. */
export function FeaturedHotel({ h, label, link, tag }: { h: HotelPick; label: string; link: LinkParams; tag: string }) {
  const t = useT();
  const price = usePrice();
  return (
    <Card>
      <p className="text-footnote font-semibold text-cobalt">{label}</p>
      <h3 className="zh mt-1 text-headline">{h.name}</h3>
      <p className="text-footnote text-muted">{[h.brand, h.district && <span key="d" className="zh">{h.district}</span>].filter(Boolean).reduce<React.ReactNode[]>((a, x, i) => (i ? [...a, " · ", x] : [x]), [])}</p>
      <Facts h={h} />
      <p className="mt-3 text-title tabular-nums">{fmt(t.stay.perNight, { price: price(h.cny) })}</p>
      <p className="text-footnote text-muted">{t.stay.priceRef}</p>
      <div className="mt-3 flex gap-2">
        <a href={goLink("trip", "hotel_search", { ...link, keyword: h.name }, "stay_pick", tag)} target="_blank" rel="noopener" onClick={() => track("hotel_pick_click", { tag })}
          className="flex min-h-control flex-1 items-center justify-center gap-2 rounded-control bg-cta px-4 text-headline text-cta-ink">
          {t.stay.checkTrip} <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
        <a href={amapNav(h, "car")} target="_blank" rel="noopener" aria-label={fmt(t.stay.onMap, { name: h.name })} className="grid min-h-control w-12 place-items-center rounded-control bg-cobalt-soft"><AppIcon id="amap" size={24} /></a>
      </div>
    </Card>
  );
}

/** A runner-up in the tier: compact row with a blue text link. */
export function HotelRow({ h, link, tag }: { h: HotelPick; link: LinkParams; tag: string }) {
  const t = useT();
  const price = usePrice();
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="zh text-body">{h.name}</p>
        <p className="text-footnote text-muted">
          {[h.brand, h.metro ? fmt(t.stay.metroShort, { m: h.metro.meters }) : null, price(h.cny)].filter(Boolean).join(" · ")}
        </p>
      </div>
      <a href={goLink("trip", "hotel_search", { ...link, keyword: h.name }, "stay_pick", tag)} target="_blank" rel="noopener" onClick={() => track("hotel_pick_click", { tag })}
        className="flex min-h-11 shrink-0 items-center gap-1 text-subhead font-semibold text-cobalt">
        {t.stay.checkPrice}<ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    </li>
  );
}
