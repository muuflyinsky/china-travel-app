"use client";
import { useEffect, useState } from "react";
import { useProfile } from "@/components/useProfile";
import { LANGUAGES } from "@/lib/languages";
import { ALLERGENS, DIETS } from "@/lib/allergens";
import { goLink, CITY_EN } from "@/lib/affiliate";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "KRW", "AUD", "CAD", "SGD", "HKD", "CHF", "THB", "MYR"];
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
const plus = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

function Fx({ base }: { base: string }) {
  const [rate, setRate] = useState<number | null>(null);
  const [approx, setApprox] = useState(false);
  const [amt, setAmt] = useState("100");
  useEffect(() => { fetch(`/api/fx?base=${base}`).then((r) => r.json()).then((d) => { setRate(d.rate); setApprox(Boolean(d.approximate)); }); }, [base]);
  if (!rate) return <p className="small muted">Loading exchange rate…</p>;
  return (
    <div className="grid2">
      <label className="field">¥ CNY<input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} /></label>
      <label className="field">{base}<input readOnly value={(+amt / rate).toFixed(2)} /></label>
      <p className="small muted" style={{ gridColumn: "span 2" }}>1 {base} = ¥{rate.toFixed(3)} {approx ? "(approximate, offline)" : "(ECB reference rate)"}</p>
    </div>
  );
}

export default function Essentials() {
  const [p, set] = useProfile();
  const [from, setFrom] = useState("上海");
  const [to, setTo] = useState("北京");
  const [date, setDate] = useState(plus(3));

  return (
    <>
      <h1>Essentials</h1>
      <p className="muted">Everything to sort out before and during your trip.</p>

      <h2 id="profile">👤 My preferences</h2>
      <div className="card stack">
        <div className="grid2">
          <label className="field">My language
            <select value={p.lang} onChange={(e) => set({ lang: e.target.value })}>{LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</select>
          </label>
          <label className="field">Home currency
            <select value={p.homeCurrency} onChange={(e) => set({ homeCurrency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
        </div>
        <div className="small muted">Allergies</div>
        <div className="row wrap">
          {ALLERGENS.map((a) => <button key={a.id} className={`chip toggle ${p.allergens.includes(a.id) ? "on" : ""}`} onClick={() => set({ allergens: toggle(p.allergens, a.id) })}>{a.en}</button>)}
        </div>
        <div className="small muted">Diet</div>
        <div className="row wrap">
          {DIETS.map((d) => <button key={d.id} className={`chip toggle ${p.diets.includes(d.id) ? "on" : ""}`} onClick={() => set({ diets: toggle(p.diets, d.id) })}>{d.en}</button>)}
        </div>
      </div>

      <h2>💳 Paying</h2>
      <div className="card stack">
        <p>China is nearly cashless. Set up <b>Alipay</b> and/or <b>WeChat Pay</b> before you fly — both accept Visa, Mastercard, JCB, Diners and Discover after passport verification.</p>
        <ol className="small">
          <li>Install Alipay, register with your home phone number.</li>
          <li>Add your card under “Bank Cards” and verify your passport.</li>
          <li>Pay by scanning the merchant QR, or show your “Pay” code.</li>
        </ol>
        <p className="small muted">Small payments are usually fee-free; larger ones may carry a ~3% foreign-card fee — the app shows it before you confirm. Keep some cash (¥200–500) as backup.</p>
        <hr />
        <Fx base={p.homeCurrency} />
      </div>

      <h2>🛂 Visa & entry</h2>
      <div className="card stack small">
        <p><b>Visa-free entry</b> now covers many countries (up to 30 days for most of Europe, Australia, NZ, Japan, Korea, parts of Latin America and the Gulf).</p>
        <p><b>240-hour visa-free transit</b>: citizens of 55 countries (incl. USA, UK, Canada) can stay up to 10 days when flying on to a <i>third</i> country, entering through designated ports and staying within the permitted provinces.</p>
        <p>Fill in the <b>arrival card</b> online before landing to skip the paper form.</p>
        <p className="muted">Rules change often — always confirm on the National Immigration Administration site before booking.</p>
        <a className="btn sm" href="https://en.nia.gov.cn" target="_blank">Official NIA website</a>
      </div>

      <h2>📶 Internet</h2>
      <div className="card stack small">
        <p>Google, WhatsApp, Instagram, Gmail and many western sites are blocked on Chinese networks. A travel eSIM with international roaming routes data abroad, so your usual apps keep working. Install it before departure.</p>
        <a className="btn primary sm" href={goLink("airalo", "esim", {}, "essentials_esim")} target="_blank">Get a China eSIM</a>
      </div>

      <h2>📱 Apps to install</h2>
      <div className="card small">
        {[
          ["Alipay 支付宝", "Payments, DiDi taxis, metro QR codes, bike sharing"],
          ["WeChat 微信", "Messaging, payments, attraction booking mini-programs"],
          ["Amap 高德地图", "Most accurate maps & transit (has an English mode)"],
          ["DiDi", "Ride-hailing, English UI, foreign cards accepted"],
          ["Trip.com", "Trains, flights, hotels, attraction tickets in English"],
          ["12306 (China Railway)", "Official train tickets; English version available"],
        ].map(([n, d]) => <div key={n} className="step"><b style={{ minWidth: 150 }}>{n}</b><span className="muted">{d}</span></div>)}
      </div>

      <h2>🚄 Trains & flights</h2>
      <div className="card stack">
        <div className="grid2">
          <label className="field">From<select value={from} onChange={(e) => setFrom(e.target.value)}>{Object.entries(CITY_EN).map(([zh, en]) => <option key={zh} value={zh}>{en}</option>)}</select></label>
          <label className="field">To<select value={to} onChange={(e) => setTo(e.target.value)}>{Object.entries(CITY_EN).map(([zh, en]) => <option key={zh} value={zh}>{en}</option>)}</select></label>
        </div>
        <label className="field">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        <div className="grid2">
          <a className="btn primary block" target="_blank" href={goLink("trip", "train", { from: CITY_EN[from], to: CITY_EN[to], date }, "essentials_train")}>🚄 Trains</a>
          <a className="btn block" target="_blank" href={goLink("trip", "flight", { from: CITY_EN[from], to: CITY_EN[to], date }, "essentials_flight")}>✈️ Flights</a>
        </div>
        <p className="small muted">Book trains with your passport number; your passport is your ticket at the gate. Popular routes sell out on holidays (Golden Week 1–7 Oct, Spring Festival) — book as soon as tickets open, ~15 days ahead.</p>
      </div>

      <h2>🎟️ Attractions</h2>
      <div className="card stack small">
        <p>Many top sights (Forbidden City, National Museum, Terracotta Army on peak days) need a <b>real-name reservation with your passport</b>, often days ahead. Walk-up tickets are frequently unavailable.</p>
        <a className="btn sm" target="_blank" href={goLink("trip", "attraction", { city: from }, "essentials_attraction")}>Tickets in {CITY_EN[from]}</a>
      </div>

      <h2>🆘 Emergency</h2>
      <div className="card">
        {[["110", "Police 报警"], ["120", "Ambulance 急救"], ["119", "Fire 火警"], ["122", "Traffic accident 交通事故"], ["12345", "City hotline — English in many big cities"]].map(([n, l]) => (
          <a key={n} href={`tel:${n}`} className="step" style={{ textDecoration: "none" }}><b style={{ minWidth: 70, fontSize: 20 }}>{n}</b><span>{l}</span></a>
        ))}
        <p className="small muted">Lost passport: report to the local police station (get a loss certificate), then contact your embassy and the city exit-entry bureau.</p>
      </div>

      <h2>ℹ️ Good to know</h2>
      <div className="card small">
        <div className="step">🔌 220 V; plugs type A, C and I.</div>
        <div className="step">🚰 Don’t drink tap water — hotels give bottled water free.</div>
        <div className="step">💁 No tipping, anywhere.</div>
        <div className="step">🪪 Carry your passport: needed for trains, hotels, museums and SIM cards.</div>
        <div className="step">🧻 Carry tissues; many public toilets don’t provide paper.</div>
      </div>
    </>
  );
}
