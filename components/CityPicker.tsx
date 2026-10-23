"use client";
import { useEffect, useState } from "react";
import { BlockTitle, List, ListItem, Popup, Preloader, Searchbar } from "konsta/react";
import { ChevronDown, LocateFixed, MapPin, X } from "lucide-react";
import { POPULAR, loadCities, searchCities, type City } from "@/lib/cities";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";

/** Button + full-screen sheet to choose any city or county in mainland China. */
export function CityPicker({
  value, onChange, onLocate, label, compact,
}: { value: City; onChange: (c: City) => void; onLocate?: () => Promise<unknown>; label?: string; compact?: boolean }) {
  const t = useT();
  const title = label ?? fmt(t.city.choose, { label: t.city.label });
  label ??= t.city.label;
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState<City[]>([]);
  const [q, setQ] = useState("");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => { if (open && !all.length) loadCities().then(setAll); }, [open, all.length]);

  const pick = (c: City) => { onChange(c); setOpen(false); setQ(""); };
  const results = searchCities(all, q);
  const popular = POPULAR.map((s) => all.find((c) => c.s === s)).filter(Boolean) as City[];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label}: ${value.e}. ${t.common.edit}`}
        className={compact
          ? "flex min-h-11 items-center gap-1 text-[17px] font-semibold text-cobalt"
          : "flex min-h-14 w-full items-center gap-3 rounded-2xl border border-line bg-card px-4 text-left"}
      >
        {compact ? (
          <><MapPin className="h-4 w-4" aria-hidden />{value.e}<ChevronDown className="h-4 w-4" aria-hidden /></>
        ) : (
          <>
            <MapPin className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />
            <span className="flex-1">
              <span className="block text-[13px] text-muted">{label}</span>
              <span className="text-[17px]">{value.e} <span className="zh text-muted">· {value.s}</span></span>
            </span>
            <ChevronDown className="h-5 w-5 text-muted" aria-hidden />
          </>
        )}
      </button>

      <Popup opened={open} onBackdropClick={() => setOpen(false)}>
        <div className="flex h-full flex-col bg-porcelain">
          <div className="flex items-center justify-between px-4 pt-[calc(12px+env(safe-area-inset-top))]">
            <h2 className="text-[22px] font-bold text-ink">{title}</h2>
            <button onClick={() => setOpen(false)} aria-label={t.common.close} className="grid h-11 w-11 place-items-center rounded-full bg-card"><X className="h-5 w-5" /></button>
          </div>
          <Searchbar
            value={q}
            placeholder={t.city.search}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
            onClear={() => setQ("")}
            disableButton={false}
          />
          <div className="flex-1 overflow-auto pb-8">
            {!all.length && <div className="flex justify-center py-8"><Preloader /></div>}

            {onLocate && !q && (
              <List strong inset>
                <ListItem
                  link
                  title={locating ? t.city.finding : t.city.useLocation}
                  media={locating ? <Preloader className="h-5! w-5!" /> : <LocateFixed className="h-5 w-5 text-cobalt" />}
                  onClick={async () => {
                    setLocating(true); setError(undefined);
                    try { await onLocate(); setOpen(false); } catch { setError(t.city.locationError); }
                    setLocating(false);
                  }}
                />
              </List>
            )}
            {error && <p className="mx-4 rounded-xl bg-warn-soft p-3 text-[15px] text-warn">{error}</p>}

            {!q && popular.length > 0 && (
              <>
                <BlockTitle>{t.city.popular}</BlockTitle>
                <div className="mx-4 grid grid-cols-2 gap-2">
                  {popular.map((c) => (
                    <button key={c.a} onClick={() => pick(c)} className="flex min-h-12 items-center justify-between rounded-xl border border-line bg-card px-3 text-left">
                      <span className="text-[15px] font-semibold">{c.e}</span><span className="zh text-[13px] text-muted">{c.s}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {q && (
              <List strong inset dividers>
                {results.map((c) => (
                  <ListItem
                    key={c.a + c.n}
                    link
                    title={<span>{c.e} <span className="zh text-muted">{c.n}</span></span>}
                    text={c.t === "county" ? `${t.city.county} · ${c.ce ? `${fmt(t.city.near, { city: c.ce })}, ` : ""}${c.p}` : c.p}
                    onClick={() => pick(c)}
                  />
                ))}
                {all.length > 0 && results.length === 0 && <ListItem title={t.city.noMatch} text={t.city.tryChinese} />}
              </List>
            )}
          </div>
        </div>
      </Popup>
    </>
  );
}
