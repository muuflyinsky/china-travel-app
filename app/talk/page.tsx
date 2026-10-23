"use client";
import { useState } from "react";
import { pinyin } from "pinyin-pro";
import { BlockTitle, List, ListItem, Preloader } from "konsta/react";
import { Mic, Volume2, Maximize2, ArrowLeftRight } from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { useProfile } from "@/components/useProfile";
import { ShowCard } from "@/components/ShowCard";
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

type SpeechRecognitionLike = {
  lang: string;
  start(): void;
  onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
  onend: () => void;
};

export default function TalkPage() {
  const [profile] = useProfile();
  const [toZh, setToZh] = useState(true);
  const [text, setText] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [listening, setListening] = useState(false);
  const [group, setGroup] = useState(PHRASES[0].group);
  const [card, setCard] = useState<string[] | null>(null);
  const me = profile.lang;
  const from = toZh ? me : "zh", to = toZh ? "zh" : me;

  async function go(t = text) {
    if (!t.trim()) return;
    setLoading(true); setRes(null); setError(undefined);
    try {
      const r = await fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: t, from, to }) });
      const d = await r.json();
      if (!r.ok) throw new Error();
      setRes(d); speak(d.translation, to);
    } catch {
      setError("Translation is unavailable right now. The phrasebook below works offline.");
    } finally {
      setLoading(false);
    }
  }

  // Web Speech API: Chrome/Android and iOS Safari 14.5+. Falls back to typing elsewhere.
  function listen() {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) { setError("Voice input isn't supported in this browser — please type instead."); return; }
    const rec = new SR();
    rec.lang = BCP47[from] ?? from;
    rec.onresult = (e) => { const t = e.results[0][0].transcript; setText(t); go(t); };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  const phrases = PHRASES.find((g) => g.group === group)!.items;

  return (
    <Screen title="Talk">
      <section className="mx-4 mt-1 rounded-3xl border border-line bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-[15px] font-semibold">{toZh ? langName(me) : "中文"}</span>
          <button onClick={() => { setToZh(!toZh); setRes(null); setText(""); }} aria-label="Swap languages" className="grid h-11 w-11 place-items-center rounded-full bg-cobalt-soft text-cobalt">
            <ArrowLeftRight className="h-5 w-5" />
          </button>
          <span className="text-[15px] font-semibold">{toZh ? "中文" : langName(me)}</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={toZh ? "Type what you want to say…" : "请在这里输入中文…"}
          aria-label="Text to translate"
          className="mt-3 min-h-24 w-full resize-none rounded-2xl bg-porcelain p-3 text-[17px] outline-none placeholder:text-muted"
        />
        <div className="mt-3 flex gap-2">
          <button onClick={listen} disabled={listening} aria-label="Speak" className={`grid h-12 w-12 place-items-center rounded-2xl ${listening ? "bg-danger text-white" : "bg-cobalt-soft text-cobalt"}`}>
            <Mic className="h-5 w-5" />
          </button>
          <button onClick={() => go()} disabled={loading || !text.trim()} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-cobalt text-[17px] font-semibold text-white disabled:opacity-40 dark:text-[#12141c]">
            {loading ? <Preloader className="h-5! w-5!" /> : "Translate"}
          </button>
        </div>

        {error && <p role="alert" className="mt-3 rounded-xl bg-warn-soft p-3 text-[15px] text-warn">{error}</p>}
        {res && (
          <div className="mt-4 border-t border-line pt-4">
            <DemoNote show={res.demo} what="ANTHROPIC_API_KEY" />
            <p className="zh text-[26px] leading-snug font-bold">{res.translation}</p>
            {res.pinyin && <p className="mt-1 text-[15px] text-muted">{res.pinyin}</p>}
            {res.note && <p className="mt-2 text-[13px] text-muted">{res.note}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={() => speak(res.translation, to)} className="flex h-11 items-center gap-1.5 rounded-xl bg-cobalt-soft px-4 font-semibold text-cobalt"><Volume2 className="h-4 w-4" aria-hidden /> Play</button>
              {toZh && <button onClick={() => setCard([res.translation])} className="flex h-11 items-center gap-1.5 rounded-xl bg-cobalt-soft px-4 font-semibold text-cobalt"><Maximize2 className="h-4 w-4" aria-hidden /> Full screen</button>}
            </div>
          </div>
        )}
      </section>

      <BlockTitle>Phrasebook · works offline</BlockTitle>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Phrase topics">
        {PHRASES.map((g) => (
          <button key={g.group} role="tab" aria-selected={g.group === group} aria-pressed={g.group === group} onClick={() => setGroup(g.group)} className="pill shrink-0 whitespace-nowrap">{g.group}</button>
        ))}
      </div>
      <List strong inset dividers>
        {phrases.map((p) => (
          <ListItem
            key={p.zh}
            title={<span className="zh text-[17px] font-semibold">{p.zh}</span>}
            subtitle={pinyin(p.zh)}
            text={p.en}
            after={
              <span className="flex gap-1">
                <button onClick={() => speak(p.zh, "zh")} aria-label={`Play ${p.en}`} className="grid h-11 w-11 place-items-center rounded-full text-cobalt"><Volume2 className="h-5 w-5" /></button>
                <button onClick={() => setCard([p.zh])} aria-label={`Show ${p.en} full screen`} className="grid h-11 w-11 place-items-center rounded-full text-cobalt"><Maximize2 className="h-5 w-5" /></button>
              </span>
            }
          />
        ))}
      </List>
      {card && <ShowCard lines={card} onClose={() => setCard(null)} />}
    </Screen>
  );
}
