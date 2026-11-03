"use client";
import { useEffect, useState } from "react";
import { Luggage, ScanLine, Plane, Banknote, ChevronDown, MapPin, Clock } from "lucide-react";
import { Screen } from "@/components/Shell";
import { Section, Card, Group, Button, Note, Seg } from "@/components/ui";
import { ShowCard } from "@/components/ShowCard";
import { SourceLine } from "@/components/SourceLine";
import { useT } from "@/components/useT";
import { useCity } from "@/components/useCity";
import { fmt, type Dict } from "@/lib/i18n";
import { SIGN_BLUE, TAX_CITIES, VERIFIED_ON, taxCity, type Counter } from "@/lib/tax-refund";

/** The official blue sign (shops: 退税商店, airport counters: 离境退税代理), drawn to the spec. */
function TaxSign({ zh }: { zh: string }) {
  return (
    <div className="flex aspect-[3/2] w-full flex-col items-center justify-center rounded-[10px] text-white" style={{ background: SIGN_BLUE }} lang="zh-CN">
      <span className="zh text-[22px] leading-tight font-bold">{zh}</span>
      <span className="mt-1 font-serif text-[17px] font-bold tracking-wide">TAX FREE</span>
    </div>
  );
}

/** "After security, turn right · about 200 m · near gate D83 · open 24 hours". */
function where(t: Dict, c: Counter) {
  const x = t.tax;
  if (c.signs) return [x.followSigns];
  const parts: string[] = [];
  if (c.walk) {
    parts.push(fmt(x.walk, { dir: x[c.walk.dir], m: c.walk.m }));
    if (c.walk.then) parts.push(fmt(x.thenWalk, { dir: x[c.walk.then.dir], m: c.walk.then.m }));
  } else parts.push(x.afterSecurity);
  if (c.floor) parts.push(fmt(x.floor, { n: c.floor }));
  if (c.gate) parts.push(fmt(c.opposite ? x.oppositeGate : x.nearGate, { gate: c.gate }));
  return parts;
}

const STEPS = [Luggage, ScanLine, Plane, Banknote];

export default function TaxRefundPage() {
  const t = useT();
  const x = t.tax;
  const { city } = useCity();
  const [at, setAt] = useState(TAX_CITIES[1].adcode);
  const [tips, setTips] = useState(false);
  const [card, setCard] = useState<string[] | null>(null);
  // Start on the traveller's city when it's one we cover.
  useEffect(() => { if (taxCity(city.a)) setAt(city.a); }, [city.a]);
  const c = taxCity(at)!;
  const name = (a: string) => x.cities[a as keyof typeof x.cities];

  return (
    <Screen title={x.title} back>
      <Section>
        <p className="px-1 text-body">{x.intro}</p>
        <Card>
          <p className="text-headline">{x.signsTitle}</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <figure><TaxSign zh="退税商店" /><figcaption className="mt-1.5 text-footnote text-muted">{x.signShop}</figcaption></figure>
            <figure><TaxSign zh="离境退税代理" /><figcaption className="mt-1.5 text-footnote text-muted">{x.signCounter}</figcaption></figure>
          </div>
        </Card>
      </Section>

      <Section title={x.stepsTitle}>
        <Card>
          <ol className="space-y-4">
            {x.steps.map((s, i) => {
              const Icon = STEPS[i];
              return (
                <li key={i} className="relative flex gap-3">
                  {/* The line between steps shows the order; it is not a map. */}
                  {i < x.steps.length - 1 && <span className="absolute top-10 bottom-[-16px] left-[17px] w-0.5 bg-line" aria-hidden />}
                  <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cobalt-soft text-cobalt"><Icon className="h-5 w-5" aria-hidden /></span>
                  <span className="min-w-0 pt-1">
                    <span className="block text-headline">{i + 1}. {s.title}</span>
                    <span className="block text-subhead text-muted">{s.body}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </Card>
        <Button variant="soft" className="w-full text-subhead!" onClick={() => setCard(["您好，我要办理离境退税。", "这是我的护照和退税单（退税码）。"])}>{x.showCustoms}</Button>
      </Section>

      <Section title={x.whereTitle}>
        <Seg value={at} onChange={setAt} label={x.whereTitle} options={TAX_CITIES.map((tc) => ({ value: tc.adcode, label: name(tc.adcode) }))} />
        {c.airports.map((a) => (
          <div key={a.code}>
            <p className="px-1 pb-1 text-subhead font-semibold">{a.en} <span className="zh font-normal text-muted" lang="zh-CN">{a.zh}</span></p>
            <Group>
              {a.counters.map((k) => (
                <li key={k.terminal || a.code} className="flex gap-3 px-4 py-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" aria-hidden />
                  <span className="min-w-0 flex-1">
                    {k.terminal && <span className="block text-body font-semibold">{k.terminal}</span>}
                    <span className="block text-subhead">{where(t, k).join(" · ")}</span>
                    {k.hours && <span className="mt-0.5 flex items-center gap-1 text-footnote text-muted"><Clock className="h-3.5 w-3.5" aria-hidden />{x.hours[k.hours]}</span>}
                  </span>
                </li>
              ))}
            </Group>
          </div>
        ))}
        {c.serviceMap && <Note>{x.shanghaiMap}</Note>}
        <p className="px-1 text-footnote text-muted">{x.otherCities}</p>
      </Section>

      <Section>
        <Card>
          <button onClick={() => setTips(!tips)} aria-expanded={tips} className="flex min-h-touch w-full items-center justify-between gap-2 text-left text-headline">
            {x.tipsTitle}<ChevronDown className={`h-5 w-5 shrink-0 text-muted transition-transform ${tips ? "rotate-180" : ""}`} aria-hidden />
          </button>
          {tips && (
            <ul className="mt-2 list-disc space-y-2 pl-5 text-subhead">
              {x.tips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          )}
        </Card>
        <Button variant="ghost" className="w-full text-subhead!" onClick={() => setCard(["请问这里可以办理离境退税吗？", "我是外国游客，这是我的护照。"])}>{x.showShop}</Button>
        <SourceLine name={x.source} date={VERIFIED_ON} />
      </Section>
      {card && <ShowCard lines={card} onClose={() => setCard(null)} />}
    </Screen>
  );
}
