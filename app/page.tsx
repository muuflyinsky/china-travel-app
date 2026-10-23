"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera, Search, Car, ShieldAlert, Siren, Check, CalendarClock, CalendarPlus, Plane, Smartphone, Wallet, LayoutGrid, Ticket, Salad, Stamp,
  Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, ChevronRight, Calculator,
} from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Card, Group, Row, Button, IconTile } from "@/components/ui";
import { ShowCard } from "@/components/ShowCard";
import { PayButtons } from "@/components/PayButtons";
import { useProfile, type Mode } from "@/components/useProfile";
import { useCity } from "@/components/useCity";
import { useT } from "@/components/useT";
import { CityPicker } from "@/components/CityPicker";
import { staffCardZh } from "@/lib/allergens";
import { stayStatus, stayReminderIcs } from "@/lib/stay";
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
  return (
    <div className="grid grid-cols-2 rounded-2xl bg-line/60 p-1" role="tablist">
      {(["planning", "in_china"] as Mode[]).map((m) => (
        <button key={m} role="tab" aria-selected={mode === m} onClick={() => onChange(m)}
          className={`min-h-10 rounded-xl text-[15px] font-semibold ${mode === m ? "bg-card shadow-sm" : "text-muted"}`}>
          {m === "planning" ? t.mode.switchToPlanning : t.mode.switchToInChina}
        </button>
      ))}
    </div>
  );
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
    </Section>
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
  const days = p.arrival ? Math.ceil((+new Date(`${p.arrival}T00:00:00`) - +new Date(new Date().toDateString())) / 864e5) : null;

  return (
    <>
      <Section>
        <Link href="/settings#trip" className="flex items-center gap-3 rounded-2xl bg-cobalt p-4 text-white dark:text-[#12141c]">
          <Plane className="h-6 w-6 shrink-0" aria-hidden />
          <span className="flex-1 text-[17px] font-semibold">
            {days === null ? t.today.addArrival : days <= 0 ? t.today.arrivingToday : fmt(t.today.arrivingIn, { n: days })}
          </span>
          <ChevronRight className="h-5 w-5 opacity-80" aria-hidden />
        </Link>
      </Section>

      <Section title={fmt(t.today.getReady, { done: done.length, total: PREP.length })}>
        <Group>
          {PREP.map(({ key, href, Icon }) => (
            <li key={key} className="flex min-h-[56px] items-center gap-3 pl-4">
              <button onClick={() => tick(key)} aria-pressed={done.includes(key)} aria-label={t.today.prep[key]}
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${done.includes(key) ? "border-cobalt bg-cobalt text-white dark:text-[#12141c]" : "border-line"}`}>
                {done.includes(key) && <Check className="h-4 w-4" strokeWidth={3} />}
              </button>
              <Link href={href} className="flex flex-1 items-center gap-3 py-3 pr-3">
                <Icon className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />
                <span className={`flex-1 text-[17px] leading-snug ${done.includes(key) ? "text-muted line-through" : ""}`}>{t.today.prep[key]}</span>
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
  const date = new Date(`${s.lastDay}T00:00:00`).toLocaleDateString(p.lang, { weekday: "short", day: "numeric", month: "short" });
  const download = () => {
    const blob = new Blob([stayReminderIcs(s.lastDay, t.stay.reminderTitle, t.stay.reminderBody)], { type: "text/calendar" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "leave-china-reminder.ics" });
    a.click();
  };
  const urgent = s.daysLeft <= 3;
  return (
    <Card tone={s.overdue ? "danger" : "plain"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted">{fmt(t.stay.dayOf, { day: Math.max(1, s.dayOfStay), total: s.allowed })}</p>
          <p className="text-[17px] font-semibold">{fmt(t.stay.leaveBy, { date })}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-[15px] font-semibold tabular-nums ${s.overdue || urgent ? "bg-danger-soft text-danger" : "bg-ok-soft text-ok"}`}>
          {s.overdue ? "!" : s.daysLeft === 0 ? t.stay.lastDay : fmt(t.stay.daysLeft, { n: s.daysLeft })}
        </span>
      </div>
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

  const hasRestrictions = profile.allergens.length + profile.diets.length > 0;

  return (
    <>
      <Section>
        <div className="flex items-center gap-1 px-1 text-[15px] text-muted">{t.city.youreIn} <CityPicker compact value={city} onChange={setCity} onLocate={detect} /></div>
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
        {wx?.casts && (
          <div className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
            <span className="text-[15px] font-semibold">{city.e}</span>
            {wx.casts.slice(0, 4).map((c) => (
              <span key={c.date} className="flex flex-col items-center gap-0.5 text-[13px]">
                <span className="text-muted">{new Date(`${c.date}T00:00:00`).toLocaleDateString(profile.lang, { weekday: "short" })}</span>
                <WeatherIcon zh={c.dayweather} />
                <span className="tabular-nums">{c.nighttemp}–{c.daytemp}°</span>
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title={t.today.pay} aside={<Link href="/pay" className="flex items-center gap-1 text-[15px] font-semibold text-cobalt"><Calculator className="h-4 w-4" aria-hidden />{t.today.priceCheck}</Link>}>
        <PayButtons compact />
      </Section>

      <Section title={t.stay.title}>
        <StayCard />
      </Section>

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
  const [demo, setDemo] = useState(false);
  useEffect(() => { fetch("/api/status").then((r) => r.json()).then((s) => setDemo(s.demoAi || s.demoMaps)).catch(() => {}); }, []);

  return (
    <Screen title={t.today.greeting}>
      <DemoNote show={demo} what="API keys" />
      {loaded && (profile.mode === null ? (
        <Onboarding onPick={(m) => set({ mode: m })} />
      ) : (
        <>
          <Section><ModeSwitch mode={profile.mode} onChange={(m) => set({ mode: m })} /></Section>
          {profile.mode === "planning" ? <Planning /> : <InChina />}
        </>
      ))}
    </Screen>
  );
}
