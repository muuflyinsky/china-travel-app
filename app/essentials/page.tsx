"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BlockTitle, List, ListInput, ListItem } from "konsta/react";
import { ChevronLeft, ExternalLink, Phone, Plug, GlassWater, HandCoins, IdCard, ScrollText } from "lucide-react";
import { Screen } from "@/components/Shell";
import { useProfile } from "@/components/useProfile";
import { LANGUAGES } from "@/lib/languages";
import { ALLERGENS, DIETS } from "@/lib/allergens";
import { goLink, CITY_EN } from "@/lib/affiliate";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "KRW", "AUD", "CAD", "SGD", "HKD", "CHF", "THB", "MYR"];
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
const plus = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
type Change = React.ChangeEvent<HTMLInputElement & HTMLSelectElement>;

const Prose = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-4 space-y-2 rounded-2xl border border-line bg-card p-4 text-[15px] leading-relaxed">{children}</div>
);
const Section = ({ id, title }: { id: string; title: string }) => <BlockTitle id={id} className="scroll-mt-4">{title}</BlockTitle>;

function Fx({ base }: { base: string }) {
  const [rate, setRate] = useState<number | null>(null);
  const [approx, setApprox] = useState(false);
  const [amt, setAmt] = useState("100");
  useEffect(() => { fetch(`/api/fx?base=${base}`).then((r) => r.json()).then((d) => { setRate(d.rate); setApprox(Boolean(d.approximate)); }).catch(() => {}); }, [base]);
  return (
    <List strong inset>
      <ListInput type="number" label="Price in ¥ CNY" inputMode="decimal" value={amt} onChange={(e: Change) => setAmt(e.target.value)} />
      <ListItem title={`In ${base}`} after={<span className="text-[17px] font-semibold text-ink tabular-nums">{rate ? (+amt / rate).toFixed(2) : "…"}</span>} footer={rate ? `1 ${base} = ¥${rate.toFixed(3)} · ${approx ? "approximate, offline" : "ECB reference rate"}` : undefined} />
    </List>
  );
}

export default function Guide() {
  const [p, set] = useProfile();
  const [from, setFrom] = useState("上海");
  const [to, setTo] = useState("北京");
  const [date, setDate] = useState(plus(3));

  return (
    <Screen
      title="Trip guide"
      right={<Link href="/" className="flex min-h-11 items-center pr-2 text-[17px] text-cobalt"><ChevronLeft className="h-6 w-6" aria-hidden />Today</Link>}
    >
      <Section id="profile" title="My preferences" />
      <List strong inset>
        <ListInput type="select" dropdown label="My language" value={p.lang} onChange={(e: Change) => set({ lang: e.target.value })}>
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
        </ListInput>
        <ListInput type="select" dropdown label="Home currency" value={p.homeCurrency} onChange={(e: Change) => set({ homeCurrency: e.target.value })}>
          {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
        </ListInput>
      </List>
      <p className="mx-4 mt-4 mb-2 text-[15px] font-semibold">Allergies <span className="font-normal text-muted">· we flag these on every menu</span></p>
      <div className="mx-4 flex flex-wrap gap-2">
        {ALLERGENS.map((a) => <button key={a.id} className="pill" aria-pressed={p.allergens.includes(a.id)} onClick={() => set({ allergens: toggle(p.allergens, a.id) })}>{a.en}</button>)}
      </div>
      <p className="mx-4 mt-4 mb-2 text-[15px] font-semibold">Diet</p>
      <div className="mx-4 flex flex-wrap gap-2">
        {DIETS.map((d) => <button key={d.id} className="pill" aria-pressed={p.diets.includes(d.id)} onClick={() => set({ diets: toggle(p.diets, d.id) })}>{d.en}</button>)}
      </div>

      <Section id="money" title="Paying" />
      <Prose>
        <p>China is nearly cashless. Set up <b>Alipay</b> or <b>WeChat Pay</b> before you fly — both accept Visa, Mastercard, JCB, Diners and Discover after passport verification.</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Install Alipay and register with your home phone number.</li>
          <li>Add your card under “Bank Cards” and verify your passport.</li>
          <li>Pay by scanning the merchant’s QR code, or show your “Pay” code.</li>
        </ol>
        <p className="text-muted">Small payments are usually fee-free; larger ones may carry a ~3% foreign-card fee, shown before you confirm. Keep ¥200–500 in cash as a backup.</p>
      </Prose>
      <Fx base={p.homeCurrency} />

      <Section id="visa" title="Visa & entry" />
      <Prose>
        <p><b>Visa-free entry</b> covers many countries — up to 30 days for most of Europe, Australia, New Zealand, Japan, Korea, and parts of Latin America and the Gulf.</p>
        <p><b>240-hour visa-free transit</b>: citizens of 55 countries (including the USA, UK and Canada) can stay up to 10 days when flying on to a <i>third</i> country, through designated ports and within permitted provinces.</p>
        <p>Fill in the arrival card online before landing to skip the paper form.</p>
        <p className="text-muted">Rules change often. Confirm with the National Immigration Administration before booking.</p>
        <a href="https://en.nia.gov.cn" target="_blank" className="inline-flex min-h-11 items-center gap-1 font-semibold text-cobalt">Official NIA website <ExternalLink className="h-4 w-4" aria-hidden /></a>
      </Prose>

      <Section id="internet" title="Internet" />
      <Prose>
        <p>Google, WhatsApp, Instagram and Gmail are blocked on Chinese networks. A travel eSIM with international roaming routes your data abroad, so your usual apps keep working. Install it before you leave.</p>
        <a href={goLink("airalo", "esim", {}, "essentials_esim")} target="_blank" className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-cta font-semibold text-cta-ink">Get a China eSIM <ExternalLink className="h-4 w-4" aria-hidden /></a>
      </Prose>

      <Section id="apps" title="Apps to install" />
      <List strong inset dividers>
        {[
          ["Alipay 支付宝", "Payments, DiDi taxis, metro QR codes, bike sharing"],
          ["WeChat 微信", "Messaging, payments, attraction booking"],
          ["Amap 高德地图", "Most accurate maps & transit, English mode"],
          ["DiDi", "Ride-hailing in English, foreign cards accepted"],
          ["Trip.com", "Trains, flights, hotels and tickets in English"],
          ["12306 China Railway", "Official train tickets, English version"],
        ].map(([n, d]) => <ListItem key={n} title={<span className="zh">{n}</span>} text={d} />)}
      </List>

      <Section id="trains" title="Trains & flights" />
      <List strong inset>
        <ListInput type="select" dropdown label="From" value={from} onChange={(e: Change) => setFrom(e.target.value)}>
          {Object.entries(CITY_EN).map(([zh, en]) => <option key={zh} value={zh}>{en}</option>)}
        </ListInput>
        <ListInput type="select" dropdown label="To" value={to} onChange={(e: Change) => setTo(e.target.value)}>
          {Object.entries(CITY_EN).map(([zh, en]) => <option key={zh} value={zh}>{en}</option>)}
        </ListInput>
        <ListInput type="date" label="Date" value={date} onChange={(e: Change) => setDate(e.target.value)} />
      </List>
      <div className="mx-4 grid grid-cols-2 gap-2">
        <a target="_blank" href={goLink("trip", "train", { from: CITY_EN[from], to: CITY_EN[to], date }, "essentials_train")} className="flex h-12 items-center justify-center rounded-xl bg-cta font-semibold text-cta-ink">Find trains</a>
        <a target="_blank" href={goLink("trip", "flight", { from: CITY_EN[from], to: CITY_EN[to], date }, "essentials_flight")} className="flex h-12 items-center justify-center rounded-xl bg-cta font-semibold text-cta-ink">Find flights</a>
      </div>
      <p className="mx-4 mt-2 text-[13px] text-muted">Book with your passport number — your passport is your ticket at the gate. Holiday routes (1–7 Oct, Spring Festival) sell out; book as soon as sales open, about 15 days ahead.</p>

      <Section id="attractions" title="Attractions" />
      <Prose>
        <p>Top sights such as the Forbidden City and the National Museum need a <b>real-name reservation with your passport</b>, often days ahead. Walk-up tickets are rarely available.</p>
        <a target="_blank" href={goLink("trip", "attraction", { city: from }, "essentials_attraction")} className="mt-1 flex h-12 items-center justify-center gap-2 rounded-xl bg-cta font-semibold text-cta-ink">Tickets in {CITY_EN[from]} <ExternalLink className="h-4 w-4" aria-hidden /></a>
      </Prose>

      <Section id="emergency" title="Emergency" />
      <List strong inset dividers>
        {[["110", "Police 报警"], ["120", "Ambulance 急救"], ["119", "Fire 火警"], ["122", "Traffic accident 交通事故"], ["12345", "City hotline, English in many big cities"]].map(([n, l]) => (
          <ListItem key={n} link href={`tel:${n}`} title={<span className="text-[22px] font-bold tabular-nums">{n}</span>} after={<span className="zh text-[15px] text-ink">{l}</span>} media={<Phone className="h-5 w-5 text-danger" aria-hidden />} />
        ))}
      </List>
      <p className="mx-4 mt-2 text-[13px] text-muted">Lost passport: report it at the local police station and get a loss certificate, then contact your embassy and the city exit-entry bureau.</p>

      <Section id="tips" title="Good to know" />
      <List strong inset dividers>
        <ListItem title="220 V; plugs type A, C and I" media={<Plug className="h-5 w-5 text-cobalt" aria-hidden />} />
        <ListItem title="Don’t drink tap water" text="Hotels give bottled water for free" media={<GlassWater className="h-5 w-5 text-cobalt" aria-hidden />} />
        <ListItem title="No tipping, anywhere" media={<HandCoins className="h-5 w-5 text-cobalt" aria-hidden />} />
        <ListItem title="Carry your passport" text="Needed for trains, hotels, museums and SIM cards" media={<IdCard className="h-5 w-5 text-cobalt" aria-hidden />} />
        <ListItem title="Carry tissues" text="Many public toilets have no paper" media={<ScrollText className="h-5 w-5 text-cobalt" aria-hidden />} />
      </List>
    </Screen>
  );
}
