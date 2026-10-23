"use client";
import { useState } from "react";
import { Phone, Hospital, Hand } from "lucide-react";
import { Screen } from "@/components/Shell";
import { Section, Card, Group, Row, Button } from "@/components/ui";
import { ShowCard } from "@/components/ShowCard";
import { useT } from "@/components/useT";

const NUMBERS = [
  ["110", "police", "报警"],
  ["120", "ambulance", "急救"],
  ["119", "fire", "火警"],
  ["122", "traffic", "交通事故"],
  ["12345", "hotline", "市民热线"],
] as const;

export default function SosPage() {
  const t = useT();
  const [card, setCard] = useState<string[] | null>(null);
  return (
    <Screen title={t.sos.title} back>
      <Section>
        <Group>
          {NUMBERS.map(([n, key, zh]) => (
            <Row key={n} href={`tel:${n}`} external icon={<Phone className="h-5 w-5 text-danger" aria-hidden />}
              title={<span className="text-[22px] font-bold tabular-nums">{n}</span>}
              sub={<>{t.sos.numbers[key]} · <span className="zh">{zh}</span></>} />
          ))}
        </Group>
        <Button variant="ink" className="w-full" onClick={() => setCard(["请帮帮我！", "我是外国游客，不会说中文。", "请帮我打电话报警或叫救护车。"])}>
          <Hand className="h-5 w-5" aria-hidden />{t.sos.help}
        </Button>
        <Button variant="soft" className="w-full" href="/go"><Hospital className="h-5 w-5" aria-hidden />{t.sos.hospital}</Button>
      </Section>

      <Section title={t.sos.lost}>
        <Card><p className="text-[15px] leading-relaxed">{t.sos.lostBody}</p></Card>
      </Section>
      {card && <ShowCard lines={card} onClose={() => setCard(null)} />}
    </Screen>
  );
}
