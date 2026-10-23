"use client";
import { useState } from "react";
import { pinyin } from "pinyin-pro";
import { useProfile } from "@/components/useProfile";
import { ShowCard } from "@/components/ShowCard";
import { DemoBadge } from "@/components/DemoBadge";
import { PHRASES } from "@/lib/phrases";
import { langName } from "@/lib/languages";

type Result = { translation: string; pinyin: string; note: string; demo?: boolean };

const BCP47: Record<string, string> = { zh: "zh-CN", en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", ru: "ru-RU", ja: "ja-JP", ko: "ko-KR", ar: "ar-SA", pt: "pt-BR", it: "it-IT", th: "th-TH", vi: "vi-VN", id: "id-ID", ms: "ms-MY", tr: "tr-TR" };

function speak(text: string, lang: string) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = BCP47[lang] ?? lang;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

export default function TalkPage() {
  const [profile] = useProfile();
  const [toZh, setToZh] = useState(true);
  const [text, setText] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [card, setCard] = useState<string[] | null>(null);
  const me = profile.lang;
  const from = toZh ? me : "zh", to = toZh ? "zh" : me;

  async function go(t = text) {
    if (!t.trim()) return;
    setLoading(true); setRes(null);
    const r = await fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: t, from, to }) });
    const d = await r.json();
    setLoading(false);
    if (r.ok) { setRes(d); speak(d.translation, to); }
  }

  // Web Speech API: Chrome/Android and iOS Safari 14.5+. Falls back to typing elsewhere.
  function listen() {
    const SR = (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!SR) return alert("Voice input isn't supported in this browser — please type.");
    const rec = new SR();
    rec.lang = BCP47[from] ?? from;
    rec.onresult = (e) => { const t = e.results[0][0].transcript; setText(t); go(t); };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  return (
    <>
      <h1>Talk</h1>
      <div className="card stack" style={{ marginTop: 12 }}>
        <div className="row spread">
          <b>{toZh ? langName(me) : "中文"} → {toZh ? "中文" : langName(me)}</b>
          <button className="btn sm" onClick={() => { setToZh(!toZh); setRes(null); setText(""); }}>⇄ Swap</button>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={toZh ? "Type what you want to say…" : "让对方在这里输入中文…"} />
        <div className="row">
          <button className="btn" onClick={listen} disabled={listening}>🎤 {listening ? "Listening…" : "Speak"}</button>
          <button className="btn primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => go()} disabled={loading}>{loading ? "Translating…" : "Translate"}</button>
        </div>
        {res && (
          <div className="stack">
            <DemoBadge show={res.demo} what="ANTHROPIC_API_KEY" />
            <div className="zh" style={{ fontSize: 22, fontWeight: 700 }}>{res.translation}</div>
            {res.pinyin && <div className="muted">{res.pinyin}</div>}
            {res.note && <div className="small muted">ℹ️ {res.note}</div>}
            <div className="row">
              <button className="btn sm" onClick={() => speak(res.translation, to)}>🔊 Play</button>
              {toZh && <button className="btn sm" onClick={() => setCard([res.translation])}>⛶ Show full screen</button>}
            </div>
          </div>
        )}
      </div>

      <h2>Phrasebook</h2>
      <p className="small muted">Works offline. Tap to hear it, long-press to show full screen.</p>
      {PHRASES.map((g) => (
        <details key={g.group} className="card" style={{ marginBottom: 10 }} open={g.group === "Basics"}>
          <summary>{g.group}</summary>
          {g.items.map((p) => (
            <div key={p.zh} className="step" style={{ cursor: "pointer" }} onClick={() => speak(p.zh, "zh")} onContextMenu={(e) => { e.preventDefault(); setCard([p.zh]); }}>
              <div style={{ flex: 1 }}>
                <div>{p.en}</div>
                <div className="zh"><b>{p.zh}</b> <span className="muted small">{pinyin(p.zh)}</span></div>
              </div>
              <span>🔊</span>
            </div>
          ))}
        </details>
      ))}
      {card && <ShowCard lines={card} onClose={() => setCard(null)} />}
    </>
  );
}

type SpeechRecognitionLike = {
  lang: string;
  start(): void;
  onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
  onend: () => void;
};
