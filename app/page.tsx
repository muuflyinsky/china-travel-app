"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Camera, Search, Siren, Check, CalendarClock, CalendarPlus, Plane, Smartphone, Wallet, LayoutGrid, Ticket, Lightbulb, BedDouble,
  Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, ChevronRight, ChevronDown, Calculator, LogIn, Receipt, PlaneTakeoff,
} from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Card, Group, Row, Button, IconTile } from "@/components/ui";
import { VisaCheck } from "@/components/VisaCheck";
import { HotelCard } from "@/components/HotelCard";
import { PayButtons } from "@/components/PayButtons";
import { PriceCheck } from "@/components/PriceCheck";
import { PaySetup } from "@/components/prep/PaySetup";
import { EsimPicker } from "@/components/prep/EsimPicker";
import { AppList } from "@/components/prep/AppList";
import { TrainBooking } from "@/components/prep/TrainBooking";
import { GoodToKnow } from "@/components/prep/GoodToKnow";
import { useProfile } from "@/components/useProfile";
import { useCity } from "@/components/useCity";
import { useT } from "@/components/useT";
import { CityPicker } from "@/components/CityPicker";
import { stayStatus, stayReminderIcs, todayIso, daysBetween } from "@/lib/stay";
import { tripPhase } from "@/lib/phase";
import { fmt } from "@/lib/i18n";

type Weather = { casts: { date: string; dayweather: string; daytemp: string; nighttemp: string }[] };

function WeatherIcon({ zh }: { zh: string }) {
  const cls = "h-5 w-5 text-muted";
  if (zh.includes("雷")) return <CloudLightning className={cls} aria-hidden />;
  if (zh.includes("雨")) return <CloudRain className={cls} aria-hidden />;
  if (zh.includes("雪")) return <Snowflake className={cls} aria-hidden />;
  if (zh.includes("雾") || zh.includes("霾")) return <CloudFog className={cls} aria-hidden />;
  if (zh.includes("阴")) return <Cloud className={cls} aria-hidden />;
  if (zh.includes("多云")) return <CloudSun className={cls} aria-hidden />;
  return <Sun className={cls} aria-hidden />;
}

const fmtDay = (iso: string, lang: string, month: "short" | "long" = "short") =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang, { timeZone: "UTC", day: "numeric", month });

// ---- before the trip ---------------------------------------------------------------------

/** What used to be the Pay, Mobile data and Before-you-go pages, as one expandable checklist. */
const PREP = [
  { key: "pay", Icon: Wallet, Body: PaySetup },
  { key: "data", Icon: Smartphone, Body: EsimPicker },
  { key: "apps", Icon: LayoutGrid, Body: AppList },
  { key: "book", Icon: Ticket, Body: TrainBooking },
  { key: "good", Icon: Lightbulb, Body: GoodToKnow },
] as const;

function Checklist() {
  const t = useT();
  const [done, setDone] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem("ctg.prep") ?? "[]")); } catch {}
    const h = location.hash.slice(1);
    if (PREP.some((x) => x.key === h)) { setOpen(h); setTimeout(() => document.getElementById(h)?.scrollIntoView({ block: "start" }), 50); }
  }, []);
  const tick = (k: string) => {
    const n = done.includes(k) ? done.filter((x) => x !== k) : [...done, k];
    setDone(n);
    try { localStorage.setItem("ctg.prep", JSON.stringify(n)); } catch {}
  };
  const count = PREP.filter((x) => done.includes(x.key)).length;
  return (
    <Section title={fmt(t.today.getReady, { done: count, total: PREP.length })}>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {PREP.map(({ key, Icon, Body }) => {
          const isOpen = open === key, isDone = done.includes(key);
          return (
            <li key={key} id={key} className="scroll-mt-4">
              <div className="flex min-h-14 items-center gap-3 pl-4">
                <button onClick={() => tick(key)} aria-pressed={isDone} aria-label={t.today.prep[key]}
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${isDone ? "border-cobalt bg-cobalt text-white dark:text-porcelain" : "border-line"}`}>
                  {isDone && <Check className="h-4 w-4" strokeWidth={3} />}
                </button>
                <button onClick={() => setOpen(isOpen ? null : key)} aria-expanded={isOpen} className="flex flex-1 items-center gap-3 py-3 pr-4 text-left">
                  <Icon className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />
                  <span className={`flex-1 text-body ${isDone ? "text-muted line-through" : ""}`}>{t.today.prep[key]}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>
              </div>
              {isOpen && <div className="px-4 pt-1 pb-4"><Body /></div>}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function BeforeTrip() {
  const t = useT();
  const [p] = useProfile();
  const days = p.arrival ? daysBetween(todayIso(), p.arrival) : null;
  return (
    <>
      <Section>
        <VisaCheck />
        <p className="px-1 text-footnote text-muted">{t.prepare.arrivalCard}</p>
      </Section>
      <Section>
        <Link href="/settings#dates" className="flex items-center gap-3 rounded-2xl bg-cobalt p-4 text-white dark:text-porcelain">
          <Plane className="h-6 w-6 shrink-0" aria-hidden />
          <span className="flex-1 text-headline">
            {days === null || days < 0 ? t.today.addArrival : fmt(t.today.arrivingIn, { n: days })}
          </span>
          <ChevronRight className="h-5 w-5 opacity-80" aria-hidden />
        </Link>
        <Group>
          <Row href="/stay" icon={<IconTile><BedDouble className="h-5 w-5" aria-hidden /></IconTile>} title={t.prepare.hotelsLink} sub={t.prepare.hotelsBody} />
        </Group>
      </Section>
      <Checklist />
      <Section>
        <Group>
          <Row href="/menu" icon={<IconTile><Camera className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.tryMenu} sub={t.today.tryMenuSub} />
        </Group>
      </Section>
    </>
  );
}

// ---- in China ----------------------------------------------------------------------------

/** After the arrival date: one tap to confirm the entry date instead of typing it. */
function EntryConfirm() {
  const t = useT();
  const [p, set] = useProfile();
  if (!p.arrival || p.entryDate || p.arrival > todayIso()) return null;
  return (
    <Card>
      <p className="flex items-center gap-2 text-headline"><LogIn className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />{fmt(t.today.entryConfirm, { date: fmtDay(p.arrival, p.lang, "long") })}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button onClick={() => set({ entryDate: p.arrival })} className="text-subhead!"><Check className="h-5 w-5" aria-hidden />{t.today.entryYes}</Button>
        <Button variant="soft" href="/settings#entry" className="text-subhead!">{t.today.entryOther}</Button>
      </div>
    </Card>
  );
}

function StayCard() {
  const t = useT();
  const [p] = useProfile();
  const s = stayStatus(p.entryDate, p.entryType, p.visaDays);
  if (!s) {
    return (
      <Group>
        <Row href="/settings#entry" icon={<IconTile><CalendarClock className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.stayTrack} sub={t.today.stayTrackSub} />
      </Group>
    );
  }
  const download = () => {
    const blob = new Blob([stayReminderIcs(s.lastDay, t.stay.reminderTitle, t.stay.reminderBody)], { type: "text/calendar" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "leave-china-reminder.ics" });
    a.click();
  };
  const urgent = s.overdue || s.daysLeft <= 3;
  return (
    <Card tone={s.overdue ? "danger" : "plain"}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-footnote text-muted">{fmt(t.stay.dayOf, { day: Math.max(1, s.dayOfStay), total: s.allowed })}</p>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-footnote font-semibold whitespace-nowrap tabular-nums ${urgent ? "bg-danger-soft text-danger" : "bg-porcelain text-ink"}`}>
          {s.overdue ? "!" : s.daysLeft === 0 ? t.stay.lastDay : fmt(t.stay.daysLeft, { n: s.daysLeft })}
        </span>
      </div>
      <p className="text-title">{fmt(t.stay.leaveBy, { date: fmtDay(s.lastDay, p.lang) })}</p>
      {s.overdue && <p className="mt-2 text-subhead text-danger">{fmt(t.stay.overdue, { n: -s.daysLeft })}</p>}
      <div className="mt-3 flex gap-2">
        <Button variant="soft" onClick={download} className="flex-1 text-subhead!"><CalendarPlus className="h-4 w-4" aria-hidden />{t.stay.reminder}</Button>
        <Button variant="ghost" href="/settings#entry" className="text-subhead!">{t.common.edit}</Button>
      </div>
    </Card>
  );
}

function CityLine() {
  const t = useT();
  const { city, setCity, detect, detected } = useCity();
  const [wx, setWx] = useState<Weather | null>(null);
  useEffect(() => {
    setWx(null);
    fetch(`/api/weather?adcode=${city.a}`).then((r) => r.json()).then((d) => d.casts && setWx(d)).catch(() => {});
  }, [city.a]);
  // If location access was already granted, find the city without asking.
  useEffect(() => {
    if (detected) return;
    navigator.permissions?.query({ name: "geolocation" }).then((p) => { if (p.state === "granted") detect().catch(() => {}); }).catch(() => {});
  }, [detected, detect]);
  const today = wx?.casts?.[0];
  return (
    <div className="flex items-center gap-1 px-1 text-subhead text-muted">
      {t.city.youreIn} <CityPicker compact value={city} onChange={setCity} onLocate={detect} />
      {today && <span className="ml-auto flex items-center gap-1.5 tabular-nums"><WeatherIcon zh={today.dayweather} />{today.nighttemp}–{today.daytemp}°</span>}
    </div>
  );
}

function MenuHero() {
  const t = useT();
  return (
    <Card tone="brand">
      <h2 className="text-title">{t.today.readMenu}</h2>
      <p className="mt-1 text-subhead opacity-90">{t.today.readMenuSub}</p>
      <Link href="/menu" className="mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-headline text-cobalt dark:bg-porcelain">
        <Camera className="h-5 w-5" aria-hidden /> {t.today.scanMenu}
      </Link>
    </Card>
  );
}

function PaySection() {
  const t = useT();
  const [calc, setCalc] = useState(false);
  return (
    <Section title={t.today.pay} aside={
      <button onClick={() => setCalc(!calc)} aria-expanded={calc} className="flex min-h-11 items-center gap-1 text-subhead font-semibold text-cobalt">
        <Calculator className="h-4 w-4" aria-hidden />{t.today.priceCheck}
      </button>
    }>
      {calc && <Card><PriceCheck /></Card>}
      <PayButtons compact />
    </Section>
  );
}

function ArrivalDay() {
  const t = useT();
  return (
    <>
      <Section>
        <CityLine />
        <EntryConfirm />
      </Section>
      <Section title={t.hotel.back}><HotelCard /></Section>
      <Section><MenuHero /></Section>
      <PaySection />
    </>
  );
}

function InChina() {
  const t = useT();
  return (
    <>
      <Section>
        <CityLine />
        <EntryConfirm />
        <MenuHero />
        <Link href="/explore" className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-card px-4 text-body text-muted">
          <Search className="h-5 w-5" aria-hidden /> {t.today.whereTo}
        </Link>
      </Section>
      <PaySection />
      <Section><StayCard /></Section>
    </>
  );
}

function Leaving() {
  const t = useT();
  const [p] = useProfile();
  return (
    <>
      <Section>
        <CityLine />
        <StayCard />
      </Section>
      <Section>
        <Card>
          <h3 className="flex items-center gap-2 text-headline"><PlaneTakeoff className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />{t.today.airportTitle}</h3>
          <p className="mt-1 text-subhead">{p.departure ? fmt(t.today.airportBody, { date: fmtDay(p.departure, p.lang, "long") }) : t.today.airportBodyNoDate}</p>
          <Button variant="soft" href={`/explore?q=${encodeURIComponent("机场")}`} className="mt-3 w-full text-subhead!">{t.today.airportFind}</Button>
        </Card>
        <Card>
          <h3 className="flex items-center gap-2 text-headline"><Receipt className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />{t.today.taxTitle}</h3>
          <p className="mt-1 text-subhead">{t.today.taxBody}</p>
        </Card>
      </Section>
      <PaySection />
    </>
  );
}

export default function Home() {
  const t = useT();
  const [profile, set, loaded] = useProfile();
  const [demo, setDemo] = useState<{ demoAi: boolean; demoMaps: boolean } | null>(null);
  useEffect(() => { fetch("/api/status").then((r) => r.json()).then(setDemo).catch(() => {}); }, []);

  // If location access was already granted and it shows the traveller in China, remember that:
  // it moves Today to the in-China cards even without dates.
  useEffect(() => {
    if (!loaded || profile.locatedInChina) return;
    navigator.permissions?.query({ name: "geolocation" }).then((perm) => {
      if (perm.state !== "granted") return;
      navigator.geolocation.getCurrentPosition(async ({ coords: { longitude: lng, latitude: lat } }) => {
        if (lng < 73 || lng > 135 || lat < 18 || lat > 54) return; // rough box first; Amap has the final say
        const r = await fetch(`/api/regeo?lng=${lng}&lat=${lat}`).catch(() => null);
        const d = r?.ok ? await r.json() : null;
        if (typeof d?.adcode === "string" && d.adcode) set({ locatedInChina: true });
      }, () => {}, { maximumAge: 600000, timeout: 10000 });
    }).catch(() => {});
  }, [loaded, profile.locatedInChina, set]);

  const phase = tripPhase(profile);
  return (
    <Screen title={t.today.greeting}>
      <DemoNote show={Boolean(demo?.demoAi || demo?.demoMaps)} what={[demo?.demoAi && t.common.aiKey, demo?.demoMaps && t.common.mapKey].filter(Boolean).join(" + ")} />
      {loaded && (
        phase === "before" ? <BeforeTrip />
        : phase === "arrival" ? <ArrivalDay />
        : phase === "leaving" ? <Leaving />
        : <InChina />
      )}
      {loaded && (
        <Section>
          <Group>
            <Row href="/sos" icon={<IconTile tone="danger"><Siren className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.help} sub={t.today.helpSub} />
          </Group>
        </Section>
      )}
    </Screen>
  );
}
