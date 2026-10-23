"use client";
import { useState } from "react";
import { ExternalLink, Plug, GlassWater, HandCoins, IdCard, ScrollText, Wallet, Smartphone, BedDouble, CalendarClock } from "lucide-react";
import { Screen } from "@/components/Shell";
import { Section, Card, Group, Row, Field, Button, IconTile } from "@/components/ui";
import { AppIcon } from "@/components/AppIcon";
import { CityPicker } from "@/components/CityPicker";
import { useCity } from "@/components/useCity";
import { useT } from "@/components/useT";
import { appStoreUrl, playStoreUrl, APPS } from "@/lib/apps";
import { goLink } from "@/lib/affiliate";
import type { City } from "@/lib/cities";
import { fmt } from "@/lib/i18n";

const BEIJING: City = { n: "北京市", s: "北京", a: "110000", p: "Beijing", e: "Beijing", py: "beijing", t: "city" };
const plus = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);
const APP_LIST = ["alipay", "wechat", "amap", "didi", "tripcom", "rail12306"] as const;

export default function Prepare() {
  const t = useT();
  const { city: here, detect } = useCity();
  const [fromPick, setFrom] = useState<City | null>(null);
  const from = fromPick ?? here;
  const [to, setTo] = useState<City>(BEIJING);
  const [date, setDate] = useState(plus(3));
  const android = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);

  return (
    <Screen title={t.prepare.title} back>
      <Section title={t.prepare.visa} id="visa">
        <Card>
          <div className="space-y-2 text-[15px] leading-relaxed">
            <p>{t.prepare.visaFree}</p>
            <p>{t.prepare.transit}</p>
            <p>{t.prepare.arrivalCard}</p>
            <p className="text-muted">{t.prepare.rulesChange}</p>
          </div>
          <a href="https://en.nia.gov.cn" target="_blank" rel="noopener" className="mt-2 inline-flex min-h-11 items-center gap-1 font-semibold text-cobalt">
            {t.prepare.nia} <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </Card>
        <Group>
          <Row href="/settings#trip" icon={<IconTile><CalendarClock className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.stayTrack} sub={t.prepare.stayHint} />
        </Group>
      </Section>

      <Section title={t.prepare.money}>
        <Group>
          <Row href="/pay" icon={<IconTile><Wallet className="h-5 w-5" aria-hidden /></IconTile>} title={t.prepare.moneyLink} sub={t.prepare.moneyBody} />
          <Row href="/esim" icon={<IconTile><Smartphone className="h-5 w-5" aria-hidden /></IconTile>} title={t.prepare.dataLink} sub={t.prepare.dataBody} />
        </Group>
      </Section>

      <Section title={t.prepare.apps} id="apps">
        <Group>
          {APP_LIST.map((id) => {
            const app = APPS[id];
            const store = (android && playStoreUrl(id)) || appStoreUrl(id);
            return (
              <Row key={id} href={store} external icon={<AppIcon id={id} size={44} />}
                title={<>{app.name}{"zh" in app && app.zh && <span className="zh text-muted"> {app.zh}</span>}</>}
                sub={t.prepare.appsWhy[id]}
                after={<span className="rounded-full bg-cobalt-soft px-3 py-1 text-[13px] font-semibold text-cobalt">{t.common.getApp}</span>}
                chevron={false} />
            );
          })}
        </Group>
      </Section>

      <Section title={t.prepare.book} id="book">
        <div className="space-y-2">
          <CityPicker label={t.prepare.from} value={from} onChange={setFrom} onLocate={detect} />
          <CityPicker label={t.prepare.to} value={to} onChange={setTo} />
        </div>
        <Group>
          <Field label={t.prepare.date}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        </Group>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="cta" external href={goLink("trip", "train", { from: from.e, to: to.e, date }, "prepare_train")}>{t.prepare.findTrains}</Button>
          <Button variant="cta" external href={goLink("trip", "flight", { from: from.e, to: to.e, date }, "prepare_flight")}>{t.prepare.findFlights}</Button>
        </div>
        <p className="px-1 text-[13px] text-muted">{t.prepare.bookNote}</p>
        <Group>
          <Row href="/stay" icon={<IconTile><BedDouble className="h-5 w-5" aria-hidden /></IconTile>} title={t.prepare.hotelsLink} sub={t.prepare.hotelsBody} />
        </Group>
        <Card>
          <h3 className="text-[17px] font-semibold">{t.prepare.sights}</h3>
          <p className="mt-1 text-[15px] leading-relaxed">{t.prepare.sightsBody}</p>
          <Button variant="cta" external className="mt-3 w-full" href={goLink("trip", "attraction", { city: to.s, cityEn: to.e }, "prepare_attraction")}>
            {fmt(t.prepare.tickets, { city: to.e })} <ExternalLink className="h-4 w-4" aria-hidden />
          </Button>
        </Card>
        <p className="px-1 text-[13px] text-muted">{t.common.commission}</p>
      </Section>

      <Section title={t.prepare.good}>
        <Group>
          <Row icon={<Plug className="h-5 w-5 text-cobalt" aria-hidden />} title={t.prepare.goodItems.plug} chevron={false} />
          <Row icon={<GlassWater className="h-5 w-5 text-cobalt" aria-hidden />} title={t.prepare.goodItems.water} chevron={false} />
          <Row icon={<HandCoins className="h-5 w-5 text-cobalt" aria-hidden />} title={t.prepare.goodItems.tip} chevron={false} />
          <Row icon={<IdCard className="h-5 w-5 text-cobalt" aria-hidden />} title={t.prepare.goodItems.passport} chevron={false} />
          <Row icon={<ScrollText className="h-5 w-5 text-cobalt" aria-hidden />} title={t.prepare.goodItems.tissues} chevron={false} />
        </Group>
      </Section>
    </Screen>
  );
}
