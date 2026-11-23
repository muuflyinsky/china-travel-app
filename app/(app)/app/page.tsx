"use client";
import { useEffect, useState } from "react";
import {
  Siren, Check, CalendarClock, CalendarPlus, Ticket, Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, LogIn, Receipt, ClipboardList,
} from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Card, Group, Row, Button, IconTile } from "@/components/ui";
import { VisaCheck } from "@/components/VisaCheck";
import { AppList, AppSetupNote } from "@/components/prep/AppList";
import { useProfile } from "@/components/useProfile";
import { useCity } from "@/components/useCity";
import { useT } from "@/components/useT";
import { CityPicker } from "@/components/CityPicker";
import { EditSheet } from "@/components/EditSheet";
import { StayWarning } from "@/components/StayWarning";
import { Shortcuts } from "@/components/today/Shortcuts";
import { ReminderCard } from "@/components/today/ReminderCard";
import { Alarms, CityHotelRows, Checklist, fmtDay, useAlarms } from "@/components/today/Plan";
import { stayWindow, stayReminderIcs, todayIso, daysBetween } from "@/lib/stay";
import { tripPhase, type Phase } from "@/lib/phase";
import { visaRule } from "@/lib/visa";
import { fmt } from "@/lib/i18n";
import { currentPosition, locationAllowed } from "@/lib/location";

/**
 * Today, home A' (DECISIONS D17; design inbox/2026-11-10-design-首页重排.md §5): the wordmark and
 * a large title, at most one reminder card, the traveller's own shortcuts, then a few fixed rows
 * (emergency help always). Only our own pages; no app directory, icons or store links (D19).
 */

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

/** China's National Immigration Administration, mobile form (checked 2026-11-04: "入境卡填报"). */
const ARRIVAL_CARD_URL = "https://s.nia.gov.cn/ArrivalCardFillingPhone/";

/** After the arrival date: one tap to confirm the entry date instead of typing it. */
function EntryConfirm() {
  const t = useT();
  const [p, set] = useProfile();
  if (!p.arrival || p.entryDate || p.arrival > todayIso()) return null;
  return (
    <Card className="mt-2">
      <p className="flex items-center gap-2 text-headline"><LogIn className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />{fmt(t.today.entryConfirm, { date: fmtDay(p.arrival, p.lang, "long") })}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button onClick={() => set({ entryDate: p.arrival, stayUntil: "" })} className="text-subhead!"><Check className="h-5 w-5" aria-hidden />{t.today.entryYes}</Button>
        <Button variant="soft" href="/app/settings#entry" className="text-subhead!">{t.today.entryOther}</Button>
      </div>
    </Card>
  );
}

/** Stay countdown in detail (from the fixed row). Neutral colours: red, green and amber are for allergy verdicts. */
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
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="text-footnote text-muted">{fmt(t.stay.dayOf, { day: Math.max(1, s.dayOfStay), total: s.allowed })}</p>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-footnote font-semibold whitespace-nowrap tabular-nums ${urgent ? "bg-ink text-porcelain" : "bg-porcelain text-ink"}`}>
          {s.overdue ? "!" : s.daysLeft === 0 ? t.stay.lastDay : fmt(t.stay.daysLeft, { n: s.daysLeft })}
        </span>
      </div>
      <p className="text-title">{fmt(t.stay.leaveBy, { date: fmtDay(s.lastDay, p.lang) })}</p>
      {s.overdue && <p className="mt-2 text-subhead font-semibold">{fmt(t.stay.overdue, { n: -s.daysLeft })}</p>}
      <div className="mt-3"><StayWarning policy={false} /></div>
      <div className="mt-3 flex gap-2">
        <Button variant="soft" onClick={download} className="flex-1 text-subhead!"><CalendarPlus className="h-4 w-4" aria-hidden />{t.stay.reminder}</Button>
        <Button variant="ghost" href="/app/settings#entry" className="text-subhead!">{t.common.edit}</Button>
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
    locationAllowed().then((ok) => { if (ok) detect().catch(() => {}); });
  }, [detected, detect]);
  const today = wx?.casts?.[0];
  return (
    <div className="flex items-center gap-1 px-1 text-subhead text-muted">
      {t.city.youreIn} <CityPicker compact value={city} onChange={setCity} onLocate={detect} />
      {today && <span className="ml-auto flex items-center gap-1.5 tabular-nums"><WeatherIcon zh={today.dayweather} />{today.nighttemp}–{today.daytemp}°</span>}
    </div>
  );
}

const HelpRow = () => {
  const t = useT();
  // Neutral on Today (design §5.9: red, green and amber only in allergy verdicts).
  return <Row href="/app/sos" icon={<IconTile><Siren className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.help} sub={t.today.helpSub} />;
};

const TaxRow = () => {
  const t = useT();
  return <Row href="/app/tax-refund" icon={<IconTile><Receipt className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.taxRow} sub={t.today.taxRowSub} />;
};

/** Before the trip: visa, arrival card, hotels, ticket alarms, tax refund, the checklist (design §5.2). */
function BeforeRows({ visaDone }: { visaDone: boolean }) {
  const t = useT();
  const [sheet, setSheet] = useState<"visa" | "alarms" | null>(null);
  const { list, ideas } = useAlarms(true, sheet);
  const sights = list.length + ideas.length;
  return (
    <>
      <Section>
        <Group>
          {visaDone && <VisaCheck onRow={() => setSheet("visa")} />}
          {/* Only the official site: fake ones charge a fee for this free form. */}
          <Row href={ARRIVAL_CARD_URL} external icon={<IconTile><ClipboardList className="h-5 w-5" aria-hidden /></IconTile>}
            title={t.prepare.arrivalCardTitle} sub={t.prepare.arrivalCardSub} />
          <CityHotelRows />
          {sights > 0 && <Row onClick={() => setSheet("alarms")} icon={<IconTile><Ticket className="h-5 w-5" aria-hidden /></IconTile>} title={fmt(t.home.sightsToBook, { n: sights })} sub={t.resv.reminders} />}
          {/* Shown from the start, so travellers know it's here before they shop (Veer, 2026-11-03). */}
          <TaxRow />
        </Group>
        <p className="px-1 text-footnote text-muted">{t.prepare.arrivalCardLater}</p>
        <Checklist />
      </Section>
      {/* Website only: the iOS app has no app list (D19). */}
      <Section title={t.today.appsTitle} className="web-only">
        <div className="rounded-card border border-line bg-card px-4"><AppList /></div>
        <AppSetupNote />
      </Section>
      <Section><Group><HelpRow /></Group></Section>
      <EditSheet open={sheet === "visa"} title={t.visa.title} onClose={() => setSheet(null)}><VisaCheck /></EditSheet>
      <EditSheet open={sheet === "alarms"} title={t.resv.reminders} onClose={() => setSheet(null)}><Alarms suggest bare /></EditSheet>
    </>
  );
}

/** In China: the stay countdown, tax refund and emergency help, always in the same place. */
function ChinaRows() {
  const t = useT();
  const [p] = useProfile();
  const [stay, setStay] = useState(false);
  const w = stayWindow(p);
  const s = w?.entered ? w : null;
  return (
    <Section>
      <StayWarning policy={false} />
      <Group>
        {s ? (
          <Row onClick={() => setStay(true)} icon={<IconTile><CalendarClock className="h-5 w-5" aria-hidden /></IconTile>}
            title={fmt(t.stay.leaveBy, { date: fmtDay(s.lastDay, p.lang) })}
            // "Day n of N" is already under the title (the trip); here only what's left.
            sub={s.overdue ? fmt(t.stay.overdue, { n: -daysBetween(s.legal, todayIso()) }) : s.daysLeft === 0 ? t.stay.lastDay : fmt(t.stay.daysLeft, { n: s.daysLeft })}
            // A dark badge when it's urgent (not red: red is for allergies); otherwise the count sits in the subtitle.
            after={s.overdue || s.daysLeft <= 3 ? <span className="shrink-0 rounded-full bg-ink px-2.5 py-0.5 text-footnote font-semibold text-porcelain tabular-nums">{s.overdue ? "!" : s.daysLeft}</span> : undefined} />
        ) : (
          <Row href="/app/settings#entry" icon={<IconTile><CalendarClock className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.stayTrack} sub={t.today.stayTrackSub} />
        )}
        <TaxRow />
        <HelpRow />
      </Group>
      <EditSheet open={stay} title={t.stay.trip} onClose={() => setStay(false)}><StayCard /></EditSheet>
    </Section>
  );
}

function useHeading(phase: Phase) {
  const t = useT();
  const [p] = useProfile();
  const { city } = useCity();
  if (phase === "before") {
    const days = p.arrival ? daysBetween(todayIso(), p.arrival) : null;
    return { title: t.today.greeting, subtitle: days === null || days < 0 ? undefined : days === 0 ? t.today.arrivingToday : fmt(t.today.arrivingIn, { n: days }) };
  }
  const w = stayWindow(p);
  const total = w && (p.departure ? daysBetween(w.base, p.departure) + 1 : w.allowed);
  return { title: city.e, subtitle: w && total ? fmt(t.stay.dayOf, { day: Math.max(1, w.dayOfStay), total }) : undefined };
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
    (async () => {
      if (!(await locationAllowed())) return;
      const { longitude: lng, latitude: lat } = await currentPosition({ maxAgeMs: 600000 });
      if (lng < 73 || lng > 135 || lat < 18 || lat > 54) return; // rough box first; Amap has the final say
      const r = await fetch(`/api/regeo?lng=${lng}&lat=${lat}`).catch(() => null);
      const d = r?.ok ? await r.json() : null;
      if (typeof d?.adcode === "string" && d.adcode) set({ locatedInChina: true });
    })().catch(() => {});
  }, [loaded, profile.locatedInChina, set]);

  const phase = tripPhase(profile);
  const heading = useHeading(phase);
  const rule = profile.nationality ? visaRule(profile.nationality, profile.onwardThird) : null;
  const visaDone = Boolean(rule && !(rule.transitOnly && profile.onwardThird === null));
  return (
    <Screen brand title={loaded ? heading.title : t.today.greeting} subtitle={loaded ? heading.subtitle : undefined}>
      <DemoNote show={Boolean(demo?.demoAi || demo?.demoMaps)} what={[demo?.demoAi && t.common.aiKey, demo?.demoMaps && t.common.mapKey].filter(Boolean).join(" + ")} />
      {loaded && (
        <>
          {phase === "before" ? (
            // The passport question sits where a reminder would until it's answered.
            !visaDone && <div className="mt-2"><VisaCheck /></div>
          ) : (
            <>
              <div className="mt-2"><CityLine /></div>
              <EntryConfirm />
            </>
          )}
          <ReminderCard phase={phase} />
          <Shortcuts phase={phase} />
          {phase === "before" ? <BeforeRows visaDone={visaDone} /> : <ChinaRows />}
        </>
      )}
    </Screen>
  );
}
