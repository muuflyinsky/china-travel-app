"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { pinyin } from "pinyin-pro";
import { Preloader } from "konsta/react";
import { Mic, Square, Volume2, Maximize2, ArrowLeftRight, CarTaxiFront, ShieldAlert, Siren, Copy, Check, X } from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Card, Group, Row, Note, IconTile, IconButton } from "@/components/ui";
import { HotelCard } from "@/components/HotelCard";
import { allergyLinesZh } from "@/lib/allergens";
import { useProfile } from "@/components/useProfile";
import { useT } from "@/components/useT";
import { ShowCard } from "@/components/ShowCard";
import { PHRASES } from "@/lib/phrases";
import { langName } from "@/lib/languages";

type Result = { translation: string; pinyin: string; note: string; demo?: boolean };

const BCP47: Record<string, string> = { zh: "zh-CN", en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", ru: "ru-RU", ja: "ja-JP", ko: "ko-KR", ar: "ar-SA", pt: "pt-BR", it: "it-IT", th: "th-TH", vi: "vi-VN", id: "id-ID", ms: "ms-MY", tr: "tr-TR" };

function speak(text: string, lang: string, onEnd?: () => void) {
  const u = new SpeechSynthesisUtterance(text);
  u.lang = BCP47[lang] ?? lang;
  if (onEnd) u.onend = u.onerror = onEnd;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

type SpeechRecognitionLike = {
  lang: string;
  start(): void;
  stop(): void;
  onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
  onerror: (e: { error: string }) => void;
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
  const [card, setCard] = useState<{ lines: string[]; explain?: string } | null>(null);
  const [allergyCard, setAllergyCard] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  useEffect(() => () => { recRef.current?.stop(); speechSynthesis?.cancel(); }, []);
  const hasRestrictions = profile.allergens.length + profile.diets.length > 0;
  const me = profile.lang;
  const from = toZh ? me : "zh", to = toZh ? "zh" : me;

  async function go(input = text) {
    if (!input.trim()) { setError(t.talk.typeFirst); inputRef.current?.focus(); return; }
    setLoading(true); setRes(null); setError(undefined);
    let d: Result;
    try {
      const r = await fetch("/api/translate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: input, from, to }) });
      d = await r.json();
      if (!r.ok) throw new Error();
    } catch {
      setError(t.talk.down);
      return;
    } finally {
      setLoading(false);
    }
    setRes(d); setCopied(false);
    // Playback can fail (e.g. iOS right after the microphone was in use); that isn't a
    // translation failure, so it must not show the "translation unavailable" message.
    try { play(d.translation); } catch { setSpeaking(false); }
  }

  /** Plays the translation; tapping again while it plays stops it. */
  function play(text: string) {
    if (speaking) { speechSynthesis.cancel(); setSpeaking(false); return; }
    setSpeaking(true);
    speak(text, to, () => setSpeaking(false));
    // Some browsers never fire `end` (no Chinese voice, or speech blocked outside a tap): poll instead.
    const poll = setInterval(() => { if (!speechSynthesis.speaking && !speechSynthesis.pending) { clearInterval(poll); setSpeaking(false); } }, 400);
  }

  function copy(text: string) {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 2000); };
    // Older iOS WebViews refuse the Clipboard API; fall back to a selected textarea.
    const legacy = () => {
      const ta = Object.assign(document.createElement("textarea"), { value: text, readOnly: true });
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta); ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (ok) done();
    };
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, legacy); else legacy();
  }

  function swap() {
    recRef.current?.stop(); speechSynthesis.cancel(); setSpeaking(false);
    setToZh(!toZh); setRes(null); setText(""); setError(undefined);
  }

  // Web Speech API: Chrome/Android and iOS Safari 14.5+. Falls back to typing elsewhere.
  // Tap to start, tap again to stop; what was heard is translated straight away.
  function listen() {
    if (listening) { recRef.current?.stop(); return; }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) { setError(t.talk.noVoice); return; }
    const rec = new SR();
    rec.lang = BCP47[from] ?? from;
    rec.onresult = (e) => { const said = e.results[0][0].transcript; setText(said); go(said); };
    rec.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") setError(t.talk.micBlocked); };
    rec.onend = () => { setListening(false); recRef.current = null; };
    recRef.current = rec;
    speechSynthesis.cancel(); setSpeaking(false); setError(undefined);
    setListening(true);
    rec.start();
  }

  const phrases = PHRASES.find((g) => g.group === group)!.items;

  return (
    <Screen title={t.talk.title}>
      <Section>
        <Card className="p-0!">
          {/* Direction: what you type → what they read. Tap either side, or the arrows, to swap. */}
          <div className="flex items-center gap-1 border-b border-line p-1.5" role="group" aria-label={t.talk.swap}>
            <button onClick={swap} className="min-h-touch min-w-0 flex-1 truncate rounded-control px-2 text-subhead font-semibold">{toZh ? langName(me) : "中文"}</button>
            <IconButton label={t.talk.swap} onClick={swap}><ArrowLeftRight className="h-5 w-5" /></IconButton>
            <button onClick={swap} className="min-h-touch min-w-0 flex-1 truncate rounded-control px-2 text-subhead font-semibold">{toZh ? "中文" : langName(me)}</button>
          </div>
          <div className="relative">
            <textarea ref={inputRef} value={text} lang={toZh ? me : "zh-CN"} onChange={(e) => { setText(e.target.value); if (error === t.talk.typeFirst) setError(undefined); }}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) go(); }}
              placeholder={listening ? t.talk.listening : toZh ? t.talk.placeholderMe : t.talk.placeholderZh} aria-label={t.talk.translate}
              className={`block min-h-28 w-full resize-none bg-transparent p-4 pr-12 text-body outline-none placeholder:text-muted ${toZh ? "" : "zh"}`} />
            {text && !listening && (
              <button onClick={() => { setText(""); setRes(null); inputRef.current?.focus(); }} aria-label={t.talk.clear}
                className="absolute top-2 right-2 grid h-touch w-touch place-items-center text-muted"><X className="h-4 w-4" aria-hidden /></button>
            )}
          </div>
          <div className="flex items-center gap-2 px-4 pb-4">
            <button onClick={listen} aria-pressed={listening} aria-label={listening ? t.talk.stopListening : t.talk.speak}
              className={`flex h-control shrink-0 items-center gap-2 rounded-control px-4 text-subhead font-semibold ${listening ? "bg-danger text-white" : "bg-cobalt-soft text-cobalt"}`}>
              {listening ? <Square className="h-4 w-4 fill-current" aria-hidden /> : <Mic className="h-5 w-5" aria-hidden />}
              <span>{listening ? t.talk.stop : t.talk.speak}</span>
            </button>
            <button onClick={() => go()} disabled={loading || listening} className="flex h-control min-w-0 flex-1 items-center justify-center gap-2 rounded-control bg-cobalt px-3 text-headline text-white disabled:opacity-60 dark:text-porcelain">
              {loading ? <Preloader className="h-5! w-5!" /> : <span className="truncate">{t.talk.translate}</span>}
            </button>
          </div>
          {listening && <p className="-mt-2 px-4 pb-3 text-footnote text-danger" role="status">{t.talk.listening}</p>}
          {res && (
            <div className="space-y-2 border-t border-line p-4" aria-live="polite">
              <DemoNote show={res.demo} what={t.common.aiKey} />
              <p className={`text-title ${toZh ? "zh" : ""}`} lang={toZh ? "zh-CN" : me}>{res.translation}</p>
              {res.pinyin && <p className="text-subhead text-muted">{res.pinyin}</p>}
              {res.note && <p className="text-footnote text-muted">{res.note}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <button onClick={() => play(res.translation)} aria-pressed={speaking} className="flex min-h-touch items-center gap-1.5 rounded-control bg-cobalt-soft px-3.5 text-subhead font-semibold text-cobalt">
                  {speaking ? <Square className="h-3.5 w-3.5 fill-current" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}{speaking ? t.talk.stop : t.talk.play}
                </button>
                <button onClick={() => copy(res.translation)} className="flex min-h-touch items-center gap-1.5 rounded-control bg-cobalt-soft px-3.5 text-subhead font-semibold text-cobalt" aria-live="polite">
                  {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}{copied ? t.today.copied : t.today.copy}
                </button>
                {toZh && (
                  <button onClick={() => { speechSynthesis.cancel(); setSpeaking(false); setCard({ lines: [res.translation], explain: text.trim() }); }}
                    className="flex min-h-touch items-center gap-1.5 rounded-control bg-cobalt px-3.5 text-subhead font-semibold text-white dark:text-porcelain">
                    <Maximize2 className="h-4 w-4" aria-hidden />{t.talk.fullScreen}
                  </button>
                )}
              </div>
            </div>
          )}
        </Card>
        {error && <Note tone="warn">{error}</Note>}
      </Section>

      <Section title={t.today.showTo}>
        <Group>
          <Row href="/explore" icon={<IconTile><CarTaxiFront className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.taxiCard} />
          <Row
            icon={<IconTile tone="danger"><ShieldAlert className="h-5 w-5" aria-hidden /></IconTile>}
            title={t.today.allergyCard}
            sub={hasRestrictions ? undefined : t.today.allergyCardEmpty}
            onClick={() => (hasRestrictions ? setAllergyCard(true) : router.push("/settings#allergies"))}
          />
          <HotelCard bare brief />
          <Row href="/sos" icon={<IconTile tone="danger"><Siren className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.help} sub={t.today.helpSub} />
        </Group>
      </Section>

      <Section title={t.talk.phrasebook}>
        <div className="chip-row" role="tablist">
          {PHRASES.map((g) => (
            <button key={g.group} role="tab" aria-selected={g.group === group} aria-pressed={g.group === group} onClick={() => setGroup(g.group)} className="pill">
              {t.talk.groups[g.group]}
            </button>
          ))}
        </div>
        <Group>
          {phrases.map((zh) => (
            <li key={zh} className="flex items-center gap-2 py-2 pr-2 pl-4">
              <div className="min-w-0 flex-1 py-1">
                <p className="zh text-headline">{zh}</p>
                <p className="text-footnote text-muted">{pinyin(zh)}</p>
                <p className="text-subhead">{t.phrases[zh] ?? ""}</p>
              </div>
              <button onClick={() => speak(zh, "zh")} aria-label={`${t.talk.play}: ${t.phrases[zh]}`} className="grid h-11 w-11 place-items-center rounded-full text-cobalt"><Volume2 className="h-5 w-5" /></button>
              <button onClick={() => setCard({ lines: [zh], explain: t.phrases[zh] })} aria-label={`${t.talk.fullScreen}: ${t.phrases[zh]}`} className="grid h-11 w-11 place-items-center rounded-full text-cobalt"><Maximize2 className="h-5 w-5" /></button>
            </li>
          ))}
        </Group>
      </Section>
      {card && <ShowCard lines={card.lines} explain={card.explain} onClose={() => setCard(null)} />}
      {allergyCard && (() => {
        const { severe, rest } = allergyLinesZh(profile.allergens, profile.diets, profile.severe);
        return <ShowCard kind="allergy" lead={severe || undefined} lines={["您好！我有饮食限制，麻烦您帮忙确认，谢谢！"]} rest={rest}
          replies={[{ zh: "可以，没问题", mine: t.eat.replyOk }, { zh: "里面有您过敏的东西", mine: t.eat.replyContainsAny }]} onClose={() => setAllergyCard(false)} />;
      })()}
    </Screen>
  );
}
