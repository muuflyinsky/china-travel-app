"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Weather = { city: string; casts: { date: string; dayweather: string; daytemp: string; nighttemp: string }[] };
const WX: Record<string, string> = { 晴: "☀️ Sunny", 多云: "⛅ Cloudy", 阴: "☁️ Overcast", 小雨: "🌦️ Light rain", 中雨: "🌧️ Rain", 大雨: "🌧️ Heavy rain", 雷阵雨: "⛈️ Thunderstorm", 雪: "❄️ Snow", 雾: "🌫️ Fog", 霾: "😷 Haze" };

const TILES = [
  { href: "/menu", ico: "🍜", t: "Read a menu" },
  { href: "/go", ico: "🚇", t: "Metro & routes" },
  { href: "/stay", ico: "🏨", t: "Hotels" },
  { href: "/talk", ico: "💬", t: "Translate" },
  { href: "/go", ico: "🚕", t: "Taxi card" },
  { href: "/essentials#profile", ico: "⚠️", t: "My allergies" },
];

const CHECKLIST = [
  "Check visa-free / transit eligibility",
  "Set up Alipay or WeChat Pay with your card",
  "Buy a roaming eSIM (keeps Google & WhatsApp working)",
  "Install Amap, DiDi, Trip.com",
  "Book trains & big sights with your passport number",
  "Save your hotel address in Chinese",
];

export default function Home() {
  const [wx, setWx] = useState<Weather | null>(null);
  const [status, setStatus] = useState<{ demoAi: boolean; demoMaps: boolean; affiliate: boolean } | null>(null);
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    fetch("/api/weather?adcode=310000").then((r) => r.json()).then(setWx).catch(() => {});
    fetch("/api/status").then((r) => r.json()).then(setStatus);
    try { setDone(JSON.parse(localStorage.getItem("ctg.check") ?? "[]")); } catch {}
  }, []);
  const tick = (i: number) => {
    const n = done.includes(i) ? done.filter((x) => x !== i) : [...done, i];
    setDone(n);
    try { localStorage.setItem("ctg.check", JSON.stringify(n)); } catch {}
  };

  return (
    <>
      <div className="row spread">
        <div>
          <div className="muted small">你好 · Nǐ hǎo</div>
          <h1>China Travel Buddy</h1>
        </div>
        <span style={{ fontSize: 34 }}>🐼</span>
      </div>

      {status && (status.demoAi || status.demoMaps) && (
        <div className="banner warn" style={{ marginTop: 8 }}>
          Prototype running in demo mode for: {[status.demoAi && "AI menu/translation", status.demoMaps && "maps"].filter(Boolean).join(", ")}. See README to add keys.
        </div>
      )}

      {wx && wx.casts && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="row spread"><b className="zh">{wx.city}</b><span className="small muted">4-day forecast</span></div>
          <div className="row spread" style={{ marginTop: 8 }}>
            {wx.casts.map((c) => (
              <div key={c.date} style={{ textAlign: "center" }}>
                <div className="small muted">{c.date.slice(5)}</div>
                <div>{(WX[c.dayweather] ?? c.dayweather).split(" ")[0]}</div>
                <div className="small">{c.nighttemp}–{c.daytemp}°</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <h2>Quick actions</h2>
      <div className="tiles">
        {TILES.map((t) => <Link key={t.t} href={t.href} className="tile"><span className="ico">{t.ico}</span><b>{t.t}</b></Link>)}
      </div>

      <h2>Before you go · {done.length}/{CHECKLIST.length}</h2>
      <div className="card">
        {CHECKLIST.map((c, i) => (
          <label key={c} className="step" style={{ cursor: "pointer" }}>
            <input type="checkbox" checked={done.includes(i)} onChange={() => tick(i)} style={{ width: "auto" }} />
            <span style={done.includes(i) ? { textDecoration: "line-through", color: "var(--muted)" } : undefined}>{c}</span>
          </label>
        ))}
        <Link href="/essentials" className="btn sm" style={{ marginTop: 8 }}>How-to guides →</Link>
      </div>
    </>
  );
}
