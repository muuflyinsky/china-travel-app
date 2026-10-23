"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BlockTitle, List, ListItem } from "konsta/react";
import {
  Camera, Search, Car, ShieldAlert, Siren, Wallet, Settings, ChevronRight,
  Sun, CloudSun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, Check,
} from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { ShowCard } from "@/components/ShowCard";
import { useProfile } from "@/components/useProfile";
import { staffCardZh } from "@/lib/allergens";

type Weather = { city: string; casts: { date: string; dayweather: string; daytemp: string; nighttemp: string }[] };

function WeatherIcon({ zh }: { zh: string }) {
  const cls = "h-5 w-5 text-muted";
  if (zh.includes("雷")) return <CloudLightning className={cls} aria-label="Thunderstorm" />;
  if (zh.includes("雨")) return <CloudRain className={cls} aria-label="Rain" />;
  if (zh.includes("雪")) return <Snowflake className={cls} aria-label="Snow" />;
  if (zh.includes("雾") || zh.includes("霾")) return <CloudFog className={cls} aria-label="Fog / haze" />;
  if (zh.includes("阴")) return <Cloud className={cls} aria-label="Overcast" />;
  if (zh.includes("多云")) return <CloudSun className={cls} aria-label="Cloudy" />;
  return <Sun className={cls} aria-label="Sunny" />;
}

const PREP = [
  { t: "Check visa-free or transit eligibility", href: "/essentials#visa" },
  { t: "Link your card to Alipay or WeChat Pay", href: "/essentials#money" },
  { t: "Get a roaming eSIM", href: "/essentials#internet" },
  { t: "Install Amap, DiDi and Trip.com", href: "/essentials#apps" },
  { t: "Book trains and big sights with your passport", href: "/essentials#trains" },
  { t: "Set your allergies and diet", href: "/essentials#profile" },
];

const Tile = ({ Icon, danger }: { Icon: typeof Car; danger?: boolean }) => (
  <span className={`grid h-8 w-8 place-items-center rounded-lg ${danger ? "bg-danger-soft text-danger" : "bg-cobalt-soft text-cobalt"}`}>
    <Icon className="h-[18px] w-[18px]" aria-hidden />
  </span>
);

export default function Home() {
  const [profile] = useProfile();
  const router = useRouter();
  const [wx, setWx] = useState<Weather | null>(null);
  const [demo, setDemo] = useState(false);
  const [done, setDone] = useState<number[]>([]);
  const [card, setCard] = useState<string[] | null>(null);

  useEffect(() => {
    fetch("/api/weather?adcode=310000").then((r) => r.json()).then(setWx).catch(() => {});
    fetch("/api/status").then((r) => r.json()).then((s) => setDemo(s.demoAi || s.demoMaps)).catch(() => {});
    try { setDone(JSON.parse(localStorage.getItem("ctg.check") ?? "[]")); } catch {}
  }, []);

  const tick = (i: number) => {
    const n = done.includes(i) ? done.filter((x) => x !== i) : [...done, i];
    setDone(n);
    try { localStorage.setItem("ctg.check", JSON.stringify(n)); } catch {}
  };
  const hasRestrictions = profile.allergens.length + profile.diets.length > 0;

  return (
    <Screen
      title="Nǐ hǎo"
      right={<Link href="/essentials#profile" aria-label="Preferences" className="grid h-11 w-11 place-items-center text-cobalt"><Settings className="h-6 w-6" /></Link>}
    >
      <DemoNote show={demo} what="API keys (see README)" />

      <section className="mx-4 mt-2 rounded-3xl bg-cobalt p-5 text-white dark:text-[#12141c]">
        <h2 className="text-[22px] leading-tight font-bold">Read any menu</h2>
        <p className="mt-1 text-[15px] opacity-90">Every dish translated, with ingredients and allergens checked against yours.</p>
        <Link href="/menu" className="mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white text-[17px] font-semibold text-cobalt dark:bg-[#12141c]">
          <Camera className="h-5 w-5" aria-hidden /> Scan a menu
        </Link>
      </section>

      <Link href="/go" className="mx-4 mt-3 flex h-12 items-center gap-2 rounded-2xl border border-line bg-card px-4 text-[17px] text-muted">
        <Search className="h-5 w-5" aria-hidden /> Where to?
      </Link>

      {wx?.casts && (
        <div className="mx-4 mt-3 flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
          <span className="zh text-[15px] font-semibold">{wx.city}</span>
          {wx.casts.slice(0, 4).map((c) => (
            <span key={c.date} className="flex flex-col items-center gap-0.5 text-[13px]">
              <span className="text-muted">{new Date(c.date).toLocaleDateString("en", { weekday: "short" })}</span>
              <WeatherIcon zh={c.dayweather} />
              <span className="tabular-nums">{c.nighttemp}–{c.daytemp}°</span>
            </span>
          ))}
        </div>
      )}

      <BlockTitle>Show to someone</BlockTitle>
      <List strong inset dividers>
        <ListItem link onClick={() => router.push("/go")} title="Taxi card" text="Your destination in big Chinese characters" media={<Tile Icon={Car} />} />
        <ListItem
          link
          title="My allergy card"
          text={hasRestrictions ? "Tell staff what you can't eat" : "Set your allergies first"}
          media={<Tile Icon={ShieldAlert} danger />}
          onClick={() => (hasRestrictions ? setCard(staffCardZh(profile.allergens, profile.diets)) : router.push("/essentials#profile"))}
        />
        <ListItem link onClick={() => router.push("/essentials#emergency")} title="Emergency" text="110 police · 120 ambulance" media={<Tile Icon={Siren} danger />} />
        <ListItem link onClick={() => router.push("/essentials#money")} title="Paying & currency" media={<Tile Icon={Wallet} />} />
      </List>

      <BlockTitle>Before you go · {done.length} of {PREP.length}</BlockTitle>
      <List strong inset dividers>
        {PREP.map((p, i) => (
          <li key={p.t} className="flex min-h-[52px] items-center gap-3 pl-4">
            <button
              onClick={() => tick(i)}
              aria-pressed={done.includes(i)}
              aria-label={`Mark "${p.t}" done`}
              className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${done.includes(i) ? "border-cobalt bg-cobalt text-white" : "border-line"}`}
            >
              {done.includes(i) && <Check className="h-4 w-4" strokeWidth={3} />}
            </button>
            <Link href={p.href} className="flex flex-1 items-center justify-between py-3 pr-3 text-[17px]">
              <span className={done.includes(i) ? "text-muted line-through" : ""}>{p.t}</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted opacity-60" aria-hidden />
            </Link>
          </li>
        ))}
      </List>

      {card && <ShowCard lines={card} onClose={() => setCard(null)} />}
    </Screen>
  );
}
