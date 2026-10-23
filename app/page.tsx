"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Camera, Search, Siren, Check, CalendarClock, CalendarPlus, Plane, Smartphone, Wallet, Ticket, Lightbulb, BedDouble, CarTaxiFront,
  Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, ChevronRight, ChevronDown, LogIn, Receipt, PlaneTakeoff, ListChecks, QrCode, Calculator, Copy,
} from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Card, Group, Row, Button, IconTile } from "@/components/ui";
import { VisaCheck } from "@/components/VisaCheck";
import { HotelCard } from "@/components/HotelCard";
import { useHotelPicks, usePrice } from "@/components/HotelPicks";
import { PayButtons, PAY_LINKS } from "@/components/PayButtons";
import { AppIcon } from "@/components/AppIcon";
import { APPS, type AppId } from "@/lib/apps";
import { openApp } from "@/lib/openApp";
import { amapNav } from "@/lib/maplinks";
import { track } from "@/lib/track";
import { PriceCheck } from "@/components/PriceCheck";
import { PaySetup } from "@/components/prep/PaySetup";
import { EsimPicker } from "@/components/prep/EsimPicker";
import { AppList, AppSetupNote } from "@/components/prep/AppList";
import { TrainBooking } from "@/components/prep/TrainBooking";
import { GoodToKnow } from "@/components/prep/GoodToKnow";
import { useProfile } from "@/components/useProfile";
import { useCity } from "@/components/useCity";
import { useT } from "@/components/useT";
import { CityPicker } from "@/components/CityPicker";
import { EditSheet } from "@/components/EditSheet";
import { ReservationSheet } from "@/components/ReservationSheet";
import { useRouter } from "next/navigation";
import { stayWindow, stayReminderIcs, todayIso, daysBetween } from "@/lib/stay";
import { StayWarning } from "@/components/StayWarning";
import { tripPhase } from "@/lib/phase";
import { upcomingReminders, type Reminder } from "@/lib/reminders";
import { RESERVATIONS, type Reservation } from "@/lib/reservations";
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

/** How a sight's tickets are released, in one short line. */
function releaseRule(t: ReturnType<typeof useT>, r: Reservation) {
  return !r.release ? t.resv.noRelease
    : r.release.time ? fmt(t.resv.opensRule, { time: r.release.time, n: r.release.days })
    : fmt(t.resv.opensDays, { n: r.release.days });
}

/**
 * Ticket alarms: releases the traveller set an alarm for (next 48 h), then sights in their trip
 * cities that need a reservation and have no alarm yet.
 */
function Alarms({ suggest }: { suggest: boolean }) {
  const t = useT();
  const [p] = useProfile();
  const [list, setList] = useState<Reminder[]>([]);
  const [open, setOpen] = useState<Reservation | null>(null);
  useEffect(() => setList(upcomingReminders()), [open]);
  const cities = p.cities.map((c) => c.a);
  const ideas = suggest ? RESERVATIONS.filter((r) => cities.includes(r.city) && !list.some((x) => x.id === r.id)) : [];
  if (!list.length && !ideas.length) return null;
  return (
    <Section title={t.resv.reminders}>
      <Group>
        {list.map((r) => {
          const s = RESERVATIONS.find((x) => x.id === r.id);
          const when = new Date(r.at).toLocaleString(p.lang, { weekday: "short", hour: "2-digit", minute: "2-digit" });
          return s && (
            <Row key={r.id + r.visit} href={s.url ?? s.guide} external icon={<IconTile><CalendarClock className="h-5 w-5" aria-hidden /></IconTile>}
              title={s.en} sub={fmt(t.resv.reminderLine, { date: fmtDay(r.visit, p.lang, "long"), when })} />
          );
        })}
        {ideas.map((r) => (
          <Row key={r.id} onClick={() => setOpen(r)} icon={<IconTile><Ticket className="h-5 w-5" aria-hidden /></IconTile>}
            title={r.en} sub={releaseRule(t, r)} after={<span className="text-subhead font-semibold text-cobalt">{t.resv.alarm}</span>} chevron={false} />
        ))}
      </Group>
      {open && <ReservationSheet r={open} open onClose={() => setOpen(null)} />}
    </Section>
  );
}

// ---- before the trip ---------------------------------------------------------------------

/** One row per destination city with its comfort-tier pick: the highest-earning spot in the app. */
function CityHotelRow({ c }: { c: { a: string; e: string; s: string } }) {
  const t = useT();
  const price = usePrice();
  const { data } = useHotelPicks(c.a, c.s);
  const pick = data?.tiers.comfort[0] ?? data?.tiers.economy[0];
  return (
    <Row href={`/stay?${new URLSearchParams({ city: c.a, name: c.s, en: c.e })}`}
      icon={<IconTile><BedDouble className="h-5 w-5" aria-hidden /></IconTile>}
      title={fmt(t.today.hotelsFor, { city: c.e })}
      sub={pick ? <><span className="zh">{pick.name}</span> · {price(pick.cny)}</> : t.prepare.hotelsBody} />
  );
}

function CityHotels() {
  const t = useT();
  const [p] = useProfile();
  return (
    <Group>
      {p.cities.map((c) => <CityHotelRow key={c.a} c={c} />)}
      {p.cities.length === 0 && <Row href="/settings#cities" icon={<IconTile><BedDouble className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.addCities} sub={t.today.addCitiesSub} />}
    </Group>
  );
}

/** What used to be the Pay, Mobile data and Before-you-go pages, as one expandable checklist. */
const PREP = [
  { key: "pay", Icon: Wallet, Body: PaySetup },
  { key: "data", Icon: Smartphone, Body: EsimPicker },
  { key: "book", Icon: Ticket, Body: TrainBooking },
  { key: "good", Icon: Lightbulb, Body: GoodToKnow },
] as const;

function Checklist() {
  const t = useT();
  const [done, setDone] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem("ctg.prep") ?? "[]")); } catch {}
    const h = location.hash.slice(1);
    if (PREP.some((x) => x.key === h)) { setExpanded(true); setOpen(h); setTimeout(() => document.getElementById(h)?.scrollIntoView({ block: "start" }), 50); }
  }, []);
  const tick = (k: string) => {
    const n = done.includes(k) ? done.filter((x) => x !== k) : [...done, k];
    setDone(n);
    try { localStorage.setItem("ctg.prep", JSON.stringify(n)); } catch {}
  };
  const count = PREP.filter((x) => done.includes(x.key)).length;
  // Collapsed to one row until opened: the prep list matters, but less than visa and hotels.
  if (!expanded) {
    return (
      <Section>
        <Group>
          <Row onClick={() => setExpanded(true)} icon={<IconTile><ListChecks className="h-5 w-5" aria-hidden /></IconTile>}
            title={fmt(t.today.getReady, { done: count, total: PREP.length })} sub={t.today.getReadySub} />
        </Group>
      </Section>
    );
  }
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
      <Section title={days === null || days < 0 ? undefined : fmt(t.today.arrivingIn, { n: days })}>
        {(days === null || days < 0) && (
          <Group>
            <Row href="/settings#dates" icon={<IconTile><Plane className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.addArrival} />
          </Group>
        )}
        <CityHotels />
      </Section>
      <Alarms suggest />
      {/* Not folded (SPEC v0.5 P1.5): knowing which Chinese app to install is the point. */}
      <Section title={t.today.appsTitle}>
        <div className="rounded-2xl border border-line bg-card px-4"><AppList /></div>
        <AppSetupNote />
      </Section>
      <Checklist />
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
  // Counts down to the earlier of the planned departure and the latest legal exit day.
  const s = stayWindow(p);
  if (!s?.entered) return null;
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
      <div className="mt-3"><StayWarning policy={false} /></div>
      <div className="mt-3 flex gap-2">
        <Button variant="soft" onClick={download} className="flex-1 text-subhead!"><CalendarPlus className="h-4 w-4" aria-hidden />{t.stay.reminder}</Button>
        <Button variant="ghost" href="/settings#entry" className="text-subhead!">{t.common.edit}</Button>
      </div>
      <p className="mt-2 text-footnote text-muted">{t.stay.checkStamp}</p>
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

/** One of the four first-screen actions in China. */
function Tile({ icon, title, sub, onClick, href, primary, apps }: {
  icon: React.ReactNode; title: string; sub: React.ReactNode; onClick?: () => void; href?: string; primary?: boolean;
  /** Brand icons of the Chinese apps this moment uses — the only colour besides allergy colours. */
  apps?: AppId[];
}) {
  const cls = `flex min-h-[132px] flex-col items-start gap-2 rounded-2xl p-4 text-left ${primary ? "bg-cobalt text-white dark:text-porcelain" : "border border-line bg-card"}`;
  const body = (
    <>
      <span className="flex w-full items-center justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${primary ? "bg-white/20" : "bg-cobalt-soft text-cobalt"}`}>{icon}</span>
        {apps && <span className="flex -space-x-1.5">{apps.map((a) => <AppIcon key={a} id={a} size={24} />)}</span>}
      </span>
      <span className="text-headline">{title}</span>
      <span className={`line-clamp-2 text-footnote ${primary ? "opacity-90" : "text-muted"}`}>{sub}</span>
    </>
  );
  return href ? <Link href={href} className={cls}>{body}</Link> : <button onClick={onClick} className={cls}>{body}</button>;
}

/** Pay: Alipay's pay code and WeChat, one tap each; the converter is a small link. */
function PayTile({ onConvert }: { onConvert: () => void }) {
  const t = useT();
  const btn = "flex min-h-11 w-full items-center gap-2 rounded-xl border border-line bg-porcelain px-2 text-left text-subhead font-semibold";
  return (
    <div className="flex min-h-[132px] flex-col gap-2 rounded-2xl border border-line bg-card p-3">
      <span className="px-1 text-headline">{t.today.tilePay}</span>
      <button className={btn} onClick={() => openApp("alipay", PAY_LINKS.alipayPay)} aria-label={t.pay.openAlipay}>
        <AppIcon id="alipay" size={26} /><span className="min-w-0 flex-1 truncate">Alipay</span><QrCode className="h-4 w-4 shrink-0 text-cobalt" aria-hidden />
      </button>
      <button className={btn} onClick={() => openApp("wechat", PAY_LINKS.wechat)} aria-label={t.pay.openWechat}>
        <AppIcon id="wechat" size={26} /><span className="min-w-0 flex-1 truncate">WeChat</span><QrCode className="h-4 w-4 shrink-0 text-cobalt" aria-hidden />
      </button>
      <button onClick={onConvert} className="flex min-h-8 items-center gap-1 px-1 text-footnote font-semibold text-cobalt"><Calculator className="h-3.5 w-3.5" aria-hidden />{t.today.priceCheck}</button>
    </div>
  );
}

const CHINA_APPS: AppId[] = ["alipay", "wechat", "amap", "didi", "tripcom", "rail12306"];

/** "Your China apps": one tap opens each app, or its store page if it isn't installed. */
function ChinaApps() {
  const t = useT();
  return (
    <Section title={t.today.chinaApps}>
      <div className="grid grid-cols-6 gap-1">
        {CHINA_APPS.map((a) => (
          <button key={a} onClick={() => openApp(a)} className="flex min-h-[72px] flex-col items-center gap-1 rounded-xl py-1">
            <AppIcon id={a} size={44} />
            <span className="w-full truncate text-center text-footnote text-muted">{APPS[a].name.replace("Railway ", "")}</span>
          </button>
        ))}
      </div>
    </Section>
  );
}

/** Driver sheet: hotel card, Amap navigation, DiDi with the address to paste. */
function DriverApps() {
  const t = useT();
  const [p, set] = useProfile();
  const [copied, setCopied] = useState(false);
  const h = p.hotel;
  // Hotels saved before v0.5 have no coordinates: look them up once.
  useEffect(() => {
    if (!h || h.location) return;
    fetch(`/api/geocode?address=${encodeURIComponent(h.address)}`).then((r) => r.json()).then((d) => d.location && set({ hotel: { ...h, location: d.location } })).catch(() => {});
  }, [h, set]);
  if (!h) return null;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {h.location ? (
          <a href={amapNav({ location: h.location, name: h.name }, "car")} target="_blank" rel="noopener" onClick={() => track("app_open", { app: "amap" })}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-card text-subhead font-semibold"><AppIcon id="amap" size={24} />{t.today.amapToHotel}</a>
        ) : (
          <button onClick={() => openApp("amap")} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-card text-subhead font-semibold"><AppIcon id="amap" size={24} />Amap</button>
        )}
        <button onClick={() => openApp("didi")} className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-card text-subhead font-semibold"><AppIcon id="didi" size={24} />{t.today.openDidi}</button>
      </div>
      <p className="px-1 text-footnote text-muted">{t.today.didiHint}</p>
      <div className="flex items-center gap-2 rounded-2xl bg-porcelain p-3">
        <span className="zh min-w-0 flex-1 text-subhead" lang="zh-CN">{h.address}</span>
        <button onClick={() => { navigator.clipboard?.writeText(h.address).then(() => setCopied(true)).catch(() => {}); }}
          className="flex min-h-11 shrink-0 items-center gap-1 px-2 text-subhead font-semibold text-cobalt">
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}{copied ? t.today.copied : t.today.copy}
        </button>
      </div>
    </div>
  );
}

/**
 * First screen in China (SPEC v0.5): scan a menu · show the driver · pay · today, as a 2×2
 * grid that fits above the fold, then the stay countdown and emergency help.
 */
function Moments() {
  const t = useT();
  const router = useRouter();
  const [p] = useProfile();
  const { city } = useCity();
  const [sheet, setSheet] = useState<"driver" | "pay" | "today" | "stay" | null>(null);
  const [dest, setDest] = useState("");
  const [alarms, setAlarms] = useState<Reminder[]>([]);
  useEffect(() => setAlarms(upcomingReminders()), [sheet]);
  const next = alarms[0] && RESERVATIONS.find((r) => r.id === alarms[0].id);
  const nextWhen = alarms[0] && new Date(alarms[0].at).toLocaleTimeString(p.lang, { hour: "2-digit", minute: "2-digit" });
  const w = stayWindow(p);
  const s = w?.entered ? w : null;

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Tile primary href="/menu" icon={<Camera className="h-5 w-5" aria-hidden />} title={t.today.tileMenu} sub={t.today.tileMenuSub} />
        <Tile onClick={() => setSheet("driver")} icon={<CarTaxiFront className="h-5 w-5" aria-hidden />} title={t.today.tileDriver} apps={["didi", "amap"]}
          sub={p.hotel ? <span className="zh">{p.hotel.name}</span> : t.today.tileDriverAdd} />
        <PayTile onConvert={() => setSheet("pay")} />
        <Tile onClick={() => (alarms.length ? setSheet("today") : router.push("/explore"))} icon={<CalendarClock className="h-5 w-5" aria-hidden />}
          title={t.today.tileToday} sub={next ? fmt(t.today.tileTodayAlarm, { name: next.en, when: nextWhen! }) : fmt(t.today.tileTodaySub, { city: city.e })} />
      </div>
      <Group>
        {s ? (
          <Row onClick={() => setSheet("stay")} icon={<IconTile><CalendarClock className="h-5 w-5" aria-hidden /></IconTile>}
            title={fmt(t.stay.leaveBy, { date: fmtDay(s.lastDay, p.lang) })}
            sub={`${fmt(t.stay.dayOf, { day: Math.max(1, s.dayOfStay), total: s.allowed })} · ${s.overdue ? fmt(t.stay.overdue, { n: -daysBetween(s.legal, todayIso()) }) : fmt(t.stay.daysLeft, { n: s.daysLeft })}`}
            // Only a red badge when it's urgent; otherwise the count sits in the subtitle.
            after={s.overdue || s.daysLeft <= 3 ? <span className="shrink-0 rounded-full bg-danger-soft px-2.5 py-0.5 text-footnote font-semibold text-danger tabular-nums">{s.overdue ? "!" : s.daysLeft}</span> : undefined} />
        ) : (
          <Row href="/settings#entry" icon={<IconTile><CalendarClock className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.stayTrack} sub={t.today.stayTrackSub} />
        )}
        <Row href="/sos" icon={<IconTile tone="danger"><Siren className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.help} sub={t.today.helpSub} />
      </Group>
      <StayWarning policy={false} />
      <ChinaApps />

      <EditSheet open={sheet === "driver"} title={t.today.tileDriver} onClose={() => setSheet(null)}>
        <HotelCard />
        <DriverApps />
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (dest.trim()) router.push(`/explore?q=${encodeURIComponent(dest.trim())}`); }}>
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-line bg-card px-3">
            <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
            <input value={dest} onChange={(e) => setDest(e.target.value)} placeholder={t.today.driverElse} aria-label={t.today.driverElse} className="h-full min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted" />
          </label>
          <Button type="submit" className="shrink-0 px-5">{t.go.go}</Button>
        </form>
      </EditSheet>
      <EditSheet open={sheet === "pay"} title={t.today.priceCheck} onClose={() => setSheet(null)}>
        <Card><PriceCheck /></Card>
        <PayButtons />
      </EditSheet>
      <EditSheet open={sheet === "today"} title={t.today.tileToday} onClose={() => setSheet(null)}>
        <Alarms suggest={false} />
        <Button variant="soft" href="/explore" className="w-full">{fmt(t.today.tileTodaySub, { city: city.e })}</Button>
      </EditSheet>
      <EditSheet open={sheet === "stay"} title={t.stay.trip} onClose={() => setSheet(null)}>
        <StayCard />
      </EditSheet>
    </>
  );
}

/** In China, including arrival day (EntryConfirm only shows until the entry date is set). */
function InChina() {
  return (
    <Section>
      <CityLine />
      <EntryConfirm />
      <Moments />
    </Section>
  );
}

function Leaving() {
  const t = useT();
  const [p] = useProfile();
  return (
    <>
      <InChina />
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
        : phase === "leaving" ? <Leaving />
        : <InChina />
      )}
      {loaded && phase === "before" && (
        <Section>
          <Group>
            <Row href="/sos" icon={<IconTile tone="danger"><Siren className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.help} sub={t.today.helpSub} />
          </Group>
        </Section>
      )}
    </Screen>
  );
}
