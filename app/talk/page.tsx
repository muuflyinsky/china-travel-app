"use client";
import { useState } from "react";
import { pinyin } from "pinyin-pro";
import { Preloader } from "konsta/react";
import { Mic, Volume2, Maximize2, ArrowLeftRight } from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Card, Group, Note } from "@/components/ui";
import { useProfile } from "@/components/useProfile";
import { useT } from "@/components/useT";
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
  const t = useT();
  const [profile] = useProfile();
  const [toZh, setToZh] = useState(true);
  const [text, setText] = useState("");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [listening, setListening] = useState(false);
  const [group, setGroup] = useState<(typeof PHRASES)[number]["group"]>("basics");
  const [card, setCard] = useState<string[] | null>(null);
  const me = profile.lang;
  const from = toZh ? me : "zh", to = toZh ? "zh" : me;

  async function go(input = text) {
    if (!input.trim()) return;
    setLoading(true); setRes(null); setError(undefined);
    try {
      const r = await fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: input, from, to }) });
      const d = await r.json();
      if (!r.ok) throw new Error();
      setRes(d); speak(d.translation, to);
    } catch {
      setError(t.talk.down);
    } finally {
      setLoading(false);
    }
  }

  // Web Speech API: Chrome/Android and iOS Safari 14.5+. Falls back to typing elsewhere.
  function listen() {
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) { setError(t.talk.noVoice); return; }
    const rec = new SR();
    rec.lang = BCP47[from] ?? from;
    rec.onresult = (e) => { const said = e.results[0][0].transcript; setText(said); go(said); };
    rec.onend = () => setListening(false);
    setListening(true);
    rec.start();
  }

  const phrases = PHRASES.find((g) => g.group === group)!.items;

  return (
    <Screen title={t.talk.title}>
      <Section>
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold">{toZh ? langName(me) : "中文"}</span>
            <button onClick={() => { setToZh(!toZh); setRes(null); setText(""); }} aria-label={t.talk.swap} className="grid h-11 w-11 place-items-center rounded-full bg-cobalt-soft text-cobalt">
              <ArrowLeftRight className="h-5 w-5" />
            </button>
            <span className="text-[15px] font-semibold">{toZh ? "中文" : langName(me)}</span>
          </div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={toZh ? t.talk.placeholderMe : t.talk.placeholderZh} aria-label={t.talk.translate}
            className="mt-3 min-h-24 w-full resize-none rounded-2xl bg-porcelain p-3 text-[17px] outline-none placeholder:text-muted" />
          <div className="mt-3 flex gap-2">
            <button onClick={listen} disabled={listening} aria-label={t.talk.speak} className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${listening ? "bg-danger text-white" : "bg-cobalt-soft text-cobalt"}`}>
              <Mic className="h-5 w-5" />
            </button>
            <button onClick={() => go()} disabled={loading || !text.trim()} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-cobalt text-[17px] font-semibold text-white disabled:opacity-40 dark:text-[#12141c]">
              {loading ? <Preloader className="h-5! w-5!" /> : t.talk.translate}
            </button>
          </div>
          {res && (
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              <DemoNote show={res.demo} what="ANTHROPIC_API_KEY" />
              <p className="zh text-[26px] leading-snug font-bold">{res.translation}</p>
              {res.pinyin && <p className="text-[15px] text-muted">{res.pinyin}</p>}
              {res.note && <p className="text-[13px] text-muted">{res.note}</p>}
              <div className="flex gap-2 pt-1">
                <button onClick={() => speak(res.translation, to)} className="flex h-11 items-center gap-1.5 rounded-xl bg-cobalt-soft px-4 font-semibold text-cobalt"><Volume2 className="h-4 w-4" aria-hidden /> {t.talk.play}</button>
                {toZh && <button onClick={() => setCard([res.translation])} className="flex h-11 items-center gap-1.5 rounded-xl bg-cobalt-soft px-4 font-semibold text-cobalt"><Maximize2 className="h-4 w-4" aria-hidden /> {t.talk.fullScreen}</button>}
              </div>
            </div>
          )}
        </Card>
        {error && <Note tone="warn">{error}</Note>}
      </Section>

      <Section title={t.talk.phrasebook}>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist">
          {PHRASES.map((g) => (
            <button key={g.group} role="tab" aria-selected={g.group === group} aria-pressed={g.group === group} onClick={() => setGroup(g.group)} className="pill shrink-0 whitespace-nowrap">
              {t.talk.groups[g.group]}
            </button>
          ))}
        </div>
        <Group>
          {phrases.map((zh) => (
            <li key={zh} className="flex items-center gap-2 py-2 pr-2 pl-4">
              <div className="min-w-0 flex-1 py-1">
                <p className="zh text-[17px] font-semibold">{zh}</p>
                <p className="text-[13px] text-muted">{pinyin(zh)}</p>
                <p className="text-[15px]">{t.phrases[zh] ?? ""}</p>
              </div>
              <button onClick={() => speak(zh, "zh")} aria-label={`${t.talk.play}: ${t.phrases[zh]}`} className="grid h-11 w-11 place-items-center rounded-full text-cobalt"><Volume2 className="h-5 w-5" /></button>
              <button onClick={() => setCard([zh])} aria-label={`${t.talk.fullScreen}: ${t.phrases[zh]}`} className="grid h-11 w-11 place-items-center rounded-full text-cobalt"><Maximize2 className="h-5 w-5" /></button>
            </li>
          ))}
        </Group>
      </Section>
      {card && <ShowCard lines={card} onClose={() => setCard(null)} />}
    </Screen>
  );
}
