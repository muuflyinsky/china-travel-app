"use client";
import { useEffect, useState } from "react";
import { Preloader } from "konsta/react";
import { Footprints, TrainFront, Bus, CarTaxiFront, TramFront } from "lucide-react";
import { Card } from "./ui";
import { RideButtons } from "./RideButtons";
import { useT } from "./useT";
import { fmt, type Dict } from "@/lib/i18n";
import type { Place, RouteStep, Routes } from "@/lib/amap";

const STEP_ICON = { walk: Footprints, metro: TrainFront, bus: Bus, rail: TramFront } as const;

/** "地铁10号线" → "Metro Line 10", "71路" → "Bus 71"; anything else stays as Amap wrote it. */
function lineName(t: Dict, s: Exclude<RouteStep, { kind: "walk" }>) {
  const n = s.line.match(/(\d+)\s*号?线/)?.[1];
  if (s.kind === "metro" && n) return fmt(t.go.metroLine, { n });
  const bus = s.line.match(/^(\w+?)路$/)?.[1];
  if (s.kind === "bus" && bus) return fmt(t.go.busLine, { n: bus });
  if (s.kind === "rail") return fmt(t.go.train, { n: s.line });
  return s.line;
}

function Step({ s }: { s: RouteStep }) {
  const t = useT();
  const Icon = STEP_ICON[s.kind];
  return (
    <li className="flex gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" aria-hidden />
      {s.kind === "walk" ? <span>{fmt(t.go.walkM, { m: s.meters })}</span> : (
        <span className="min-w-0">
          <span className="font-semibold">{lineName(t, s)}</span>
          {"stops" in s && <span className="text-muted"> · {s.stops === 1 ? t.go.stop1 : fmt(t.go.stops, { n: s.stops })}</span>}
          <span className="block text-footnote text-muted">{s.fromPy} → {s.toPy}</span>
          {/* Chinese as on the station signs */}
          <span className="zh block text-footnote text-muted" lang="zh-CN">{s.line} · {s.from} → {s.to}</span>
        </span>
      )}
    </li>
  );
}

/**
 * Public transport and taxi to a place, inside the app (SPEC v0.5 P1.6 #23). Starts from the
 * traveller's location, or the saved hotel when location is off.
 */
export function RoutePanel({ dest, origin }: { dest: Place; origin: { location: string; label: "here" | "hotel"; citycode?: string } | null }) {
  const t = useT();
  const [r, setR] = useState<Routes | "loading" | "error" | null>(null);
  const [open, setOpen] = useState(0);

  useEffect(() => {
    if (!origin) { setR(null); return; }
    setR("loading"); setOpen(0);
    const qs = new URLSearchParams({ from: origin.location, to: dest.location, city: origin.citycode || dest.citycode, cityTo: dest.citycode });
    let alive = true;
    fetch(`/api/route?${qs}`).then((x) => (x.ok ? x.json() : Promise.reject())).then((d) => alive && setR(d)).catch(() => alive && setR("error"));
    return () => { alive = false; };
  }, [dest.location, dest.citycode, origin?.location, origin?.citycode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!origin) return <p className="px-1 text-subhead text-muted">{t.go.noOrigin}</p>;
  if (r === "loading") return <div className="flex justify-center py-4"><Preloader /></div>;
  if (r === "error" || !r) return <p className="px-1 text-subhead text-muted">{t.go.routeDown}</p>;

  return (
    <>
      <p className="px-1 text-footnote text-muted">{origin.label === "here" ? t.go.fromHere : t.go.fromHotel}</p>
      {r.transit.length === 0 ? <p className="px-1 text-subhead text-muted">{t.go.transitNone}</p> : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
          {r.transit.map((plan, i) => (
            <li key={i}>
              <button onClick={() => setOpen(i)} aria-expanded={open === i} className="flex min-h-control w-full items-center gap-3 px-4 py-2.5 text-left">
                <span className="text-headline tabular-nums">{fmt(t.go.min, { n: plan.minutes })}</span>
                <span className="min-w-0 flex-1 truncate text-footnote text-muted">
                  {plan.steps.filter((s) => s.kind !== "walk").map((s) => lineName(t, s as Exclude<RouteStep, { kind: "walk" }>)).join(" → ")}
                </span>
                <span className="shrink-0 text-subhead tabular-nums">{plan.cost != null ? `¥${plan.cost}` : ""}</span>
              </button>
              {open === i && (
                <div className="px-4 pb-3">
                  <ol className="space-y-2 text-subhead">{plan.steps.map((s, j) => <Step key={j} s={s} />)}</ol>
                  <p className="mt-2 text-footnote text-muted">{fmt(t.go.walkTotal, { m: plan.walkMeters })}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {r.taxi && (
        <Card>
          <div className="flex items-baseline gap-2">
            <CarTaxiFront className="h-5 w-5 shrink-0 self-center text-cobalt" aria-hidden />
            <span className="flex-1 text-headline">{t.go.taxi}</span>
            <span className="text-subhead tabular-nums">{fmt(t.go.taxiEst, { min: r.taxi.minutes })}{r.taxi.cost ? ` · ≈ ¥${r.taxi.cost}` : ""}</span>
          </div>
          <div className="mt-3"><RideButtons to={{ location: dest.location, name: dest.name }} address={dest.address} /></div>
        </Card>
      )}
    </>
  );
}
