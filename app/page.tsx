"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera, Search, Car, ShieldAlert, Siren, Check, CalendarClock, CalendarPlus, Plane, Smartphone, Wallet, LayoutGrid, Ticket, Salad, Stamp,
  Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, ChevronRight, Calculator, LogIn,
} from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Card, Group, Row, Button, IconTile, Seg } from "@/components/ui";
import { VisaCheck } from "@/components/VisaCheck";
import { HotelCard } from "@/components/HotelCard";
import { ShowCard } from "@/components/ShowCard";
import { PayButtons } from "@/components/PayButtons";
import { useProfile, type Mode } from "@/components/useProfile";
import { useCity } from "@/components/useCity";
import { useT } from "@/components/useT";
import { CityPicker } from "@/components/CityPicker";
import { staffCardZh } from "@/lib/allergens";
import { stayStatus, stayReminderIcs, todayIso, daysBetween } from "@/lib/stay";
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

const PREP = [
  { key: "visa", href: "/prepare#visa", Icon: Stamp },
  { key: "pay", href: "/pay", Icon: Wallet },
  { key: "data", href: "/esim", Icon: Smartphone },
  { key: "apps", href: "/prepare#apps", Icon: LayoutGrid },
  { key: "book", href: "/prepare#book", Icon: Ticket },
  { key: "food", href: "/settings#food", Icon: Salad },
] as const;

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const t = useT();
  return <Seg value={mode} onChange={onChange} label={t.mode.question}
    options={[{ value: "planning", label: t.mode.switchToPlanning }, { value: "in_china", label: t.mode.switchToInChina }]} />;
}

function Onboarding({ onPick }: { onPick: (m: Mode) => void }) {
  const t = useT();
  return (
    <Section title={t.mode.question}>
      {([["planning", Plane, t.mode.planning, t.mode.planningSub], ["in_china", Camera, t.mode.inChina, t.mode.inChinaSub]] as const).map(([m, Icon, title, sub]) => (
        <button key={m} onClick={() => onPick(m)} className="flex w-full items-center gap-4 rounded-2xl border border-line bg-card p-4 text-left">
          <IconTile><Icon className="h-5 w-5" aria-hidden /></IconTile>
          <span className="flex-1"><span className="block text-[17px] font-semibold">{title}</span><span className="block text-[15px] text-muted">{sub}</span></span>
          <ChevronRight className="h-5 w-5 text-muted" aria-hidden />
        </button>
      ))}
      <Group>
        <Row href="/settings#food" icon={<IconTile tone="danger"><ShieldAlert className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.prep.food} sub={t.settings.allergiesNote} />
      </Group>
    </Section>
  );
}

/** After the arrival date: one tap to confirm the entry date instead of typing it. */
function EntryConfirm() {
  const t = useT();
  const [p, set] = useProfile();
  if (!p.arrival || p.entryDate || p.arrival > todayIso()) return null;
  const date = new Date(`${p.arrival}T00:00:00Z`).toLocaleDateString(p.lang, { timeZone: "UTC", day: "numeric", month: "long" });
  return (
    <Card>
      <p className="flex items-center gap-2 text-[17px] font-semibold"><LogIn className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />{fmt(t.today.entryConfirm, { date })}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button onClick={() => set({ entryDate: p.arrival })} className="text-[15px]!"><Check className="h-5 w-5" aria-hidden />{t.today.entryYes}</Button>
        <Button variant="soft" href="/settings#trip" className="text-[15px]!">{t.today.entryOther}</Button>
      </div>
    </Card>
  );
}

function Planning() {
  const t = useT();
  const [p] = useProfile();
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem("ctg.prep") ?? "[]")); } catch {} }, []);
  const tick = (k: string) => {
    const n = done.includes(k) ? done.filter((x) => x !== k) : [...done, k];
    setDone(n);
    try { localStorage.setItem("ctg.prep", JSON.stringify(n)); } catch {}
  };
  const days = p.arrival ? daysBetween(todayIso(), p.arrival) : null;
  const isDone = (k: string) => done.includes(k) || (k === "visa" && Boolean(p.nationality)) || (k === "food" && p.allergiesAsked);
  const doneCount = PREP.filter((x) => isDone(x.key)).length;

  return (
    <>
      <Section><VisaCheck /></Section>
      <Section>
        <Link href="/settings#trip" className="flex items-center gap-3 rounded-2xl bg-cobalt p-4 text-white dark:text-[#12141c]">
          <Plane className="h-6 w-6 shrink-0" aria-hidden />
          <span className="flex-1 text-[17px] font-semibold">
            {days === null ? t.today.addArrival : days <= 0 ? t.today.arrivingToday : fmt(t.today.arrivingIn, { n: days })}
          </span>
          <ChevronRight className="h-5 w-5 opacity-80" aria-hidden />
        </Link>
      </Section>

      <Section title={fmt(t.today.getReady, { done: doneCount, total: PREP.length })}>
        <Group>
          {PREP.map(({ key, href, Icon }) => (
            <li key={key} className="flex min-h-[56px] items-center gap-3 pl-4">
              <button onClick={() => tick(key)} aria-pressed={isDone(key)} aria-label={t.today.prep[key]}
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${isDone(key) ? "border-cobalt bg-cobalt text-white dark:text-[#12141c]" : "border-line"}`}>
                {isDone(key) && <Check className="h-4 w-4" strokeWidth={3} />}
              </button>
              <Link href={href} className="flex flex-1 items-center gap-3 py-3 pr-3">
                <Icon className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />
                <span className={`flex-1 text-[17px] leading-snug ${isDone(key) ? "text-muted line-through" : ""}`}>{t.today.prep[key]}</span>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted opacity-60" aria-hidden />
              </Link>
            </li>
          ))}
        </Group>
      </Section>

      <Section title={t.today.tryNow}>
        <Group>
          <Row href="/menu" icon={<IconTile><Camera className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.tryMenu} sub={t.today.tryMenuSub} />
        </Group>
      </Section>
    </>
  );
}

function StayCard() {
  const t = useT();
  const [p] = useProfile();
  const s = stayStatus(p.entryDate, p.entryType, p.visaDays);
  if (!s) {
    return (
      <Group>
        <Row href="/settings#trip" icon={<IconTile><CalendarClock className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.stayTrack} sub={t.today.stayTrackSub} />
      </Group>
    );
  }
  // lastDay is a calendar date: format it in UTC so no time zone can shift it by a day.
  const date = new Date(`${s.lastDay}T00:00:00Z`).toLocaleDateString(p.lang, { timeZone: "UTC", day: "numeric", month: "short" });
  const download = () => {
    const blob = new Blob([stayReminderIcs(s.lastDay, t.stay.reminderTitle, t.stay.reminderBody)], { type: "text/calendar" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "leave-china-reminder.ics" });
    a.click();
  };
  const urgent = s.daysLeft <= 3;
  return (
    <Card tone={s.overdue ? "danger" : "plain"}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-muted">{fmt(t.stay.dayOf, { day: Math.max(1, s.dayOfStay), total: s.allowed })}</p>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[13px] font-semibold whitespace-nowrap tabular-nums ${s.overdue || urgent ? "bg-danger-soft text-danger" : "bg-cobalt-soft text-cobalt"}`}>
          {s.overdue ? "!" : s.daysLeft === 0 ? t.stay.lastDay : fmt(t.stay.daysLeft, { n: s.daysLeft })}
        </span>
      </div>
      <p className="text-[17px] font-semibold">{fmt(t.stay.leaveBy, { date })}</p>
      {s.overdue && <p className="mt-2 text-[15px] text-danger">{fmt(t.stay.overdue, { n: -s.daysLeft })}</p>}
      <div className="mt-3 flex gap-2">
        <Button variant="soft" onClick={download} className="flex-1 text-[15px]!"><CalendarPlus className="h-4 w-4" aria-hidden />{t.stay.reminder}</Button>
        <Button variant="ghost" href="/settings#trip" className="text-[15px]!">{t.common.edit}</Button>
      </div>
    </Card>
  );
}

function InChina() {
  const t = useT();
  const router = useRouter();
  const [profile] = useProfile();
  const { city, setCity, detect, detected } = useCity();
  const [wx, setWx] = useState<Weather | null>(null);
  const [card, setCard] = useState<string[] | null>(null);

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
  const hasRestrictions = profile.allergens.length + profile.diets.length > 0;

  return (
    <>
      <Section>
        <div className="flex items-center gap-1 px-1 text-[15px] text-muted">
          {t.city.youreIn} <CityPicker compact value={city} onChange={setCity} onLocate={detect} />
          {today && <span className="ml-auto flex items-center gap-1.5 tabular-nums"><WeatherIcon zh={today.dayweather} />{today.nighttemp}–{today.daytemp}°</span>}
        </div>
        <EntryConfirm />
        <Card tone="brand">
          <h2 className="text-[22px] leading-tight font-bold">{t.today.readMenu}</h2>
          <p className="mt-1 text-[15px] opacity-90">{t.today.readMenuSub}</p>
          <Link href="/menu" className="mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[17px] font-semibold text-cobalt dark:bg-[#12141c]">
            <Camera className="h-5 w-5" aria-hidden /> {t.today.scanMenu}
          </Link>
        </Card>
        <Link href="/go" className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-card px-4 text-[17px] text-muted">
          <Search className="h-5 w-5" aria-hidden /> {t.today.whereTo}
        </Link>
      </Section>

      <Section title={t.today.pay} aside={<Link href="/pay" className="flex items-center gap-1 text-[15px] font-semibold text-cobalt"><Calculator className="h-4 w-4" aria-hidden />{t.today.priceCheck}</Link>}>
        <PayButtons compact />
      </Section>

      <Section>
        <StayCard />
      </Section>

      <Section><HotelCard /></Section>

      <Section title={t.today.showTo}>
        <Group>
          <Row href="/go" icon={<IconTile><Car className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.taxiCard} sub={t.today.taxiCardSub} />
          <Row
            icon={<IconTile tone="danger"><ShieldAlert className="h-5 w-5" aria-hidden /></IconTile>}
            title={t.today.allergyCard}
            sub={hasRestrictions ? t.today.allergyCardSub : t.today.allergyCardEmpty}
            onClick={() => (hasRestrictions ? setCard(staffCardZh(profile.allergens, profile.diets)) : router.push("/settings#food"))}
          />
          <Row href="/sos" icon={<IconTile tone="danger"><Siren className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.help} sub={t.today.helpSub} />
        </Group>
      </Section>
      {card && <ShowCard lines={card} onClose={() => setCard(null)} />}
    </>
  );
}

export default function Home() {
  const t = useT();
  const [profile, set, loaded] = useProfile();
  const [demo, setDemo] = useState<{ demoAi: boolean; demoMaps: boolean } | null>(null);
  useEffect(() => { fetch("/api/status").then((r) => r.json()).then(setDemo).catch(() => {}); }, []);

  // Switch to "in China" by itself: once on the arrival date (the traveller can switch back in
  // Settings and we won't flip it again), or on first visit if location shows they're in China.
  useEffect(() => {
    if (!loaded || profile.mode === "in_china") return;
    const today = todayIso();
    let applied = "";
    try { applied = localStorage.getItem("ctg.autoMode") ?? ""; } catch {}
    if (profile.arrival && profile.arrival <= today && (!profile.departure || profile.departure >= today) && applied !== profile.arrival) {
      try { localStorage.setItem("ctg.autoMode", profile.arrival); } catch {}
      set({ mode: "in_china" });
      return;
    }
    if (profile.mode !== null) return;
    navigator.permissions?.query({ name: "geolocation" }).then((perm) => {
      if (perm.state !== "granted") return;
      navigator.geolocation.getCurrentPosition(async ({ coords: { longitude: lng, latitude: lat } }) => {
        if (lng < 73 || lng > 135 || lat < 18 || lat > 54) return; // rough box first; Amap has the final say
        const r = await fetch(`/api/regeo?lng=${lng}&lat=${lat}`).catch(() => null);
        const d = r?.ok ? await r.json() : null;
        if (typeof d?.adcode === "string" && d.adcode) set({ mode: "in_china" });
      }, () => {}, { maximumAge: 600000, timeout: 10000 });
    }).catch(() => {});
  }, [loaded, profile.mode, profile.arrival, profile.departure, set]);

  return (
    <Screen title={t.today.greeting}>
      <DemoNote show={Boolean(demo?.demoAi || demo?.demoMaps)} what={[demo?.demoAi && t.common.aiKey, demo?.demoMaps && t.common.mapKey].filter(Boolean).join(" + ")} />
      {loaded && (profile.mode === null ? (
        <Onboarding onPick={(m) => set({ mode: m })} />
      ) : (
        <>
          {profile.mode === "planning" && <Section><ModeSwitch mode={profile.mode} onChange={(m) => set({ mode: m })} /></Section>}
          {profile.mode === "planning" ? <Planning /> : <InChina />}
        </>
      ))}
    </Screen>
  );
}
