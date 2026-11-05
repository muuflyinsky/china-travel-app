"use client";
import Link from "next/link";
import { Screen } from "@/components/Shell";
import { Section } from "@/components/ui";
import { useProfile } from "@/components/useProfile";
import { fmt } from "@/lib/i18n";
import { privacyText, supportText, SUPPORT_EMAIL, UPDATED } from "@/lib/legal";

/** Privacy policy: the App Store's privacy policy URL (haodego.com/privacy). */
export default function PrivacyPage() {
  const [p] = useProfile();
  const x = privacyText(p.lang);
  const date = new Date(`${UPDATED}T00:00:00Z`).toLocaleDateString(p.lang, { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
  return (
    <Screen title={x.title} back>
      <Section>
        <p className="px-1 text-footnote text-muted">{fmt(x.updated, { date })}</p>
        <p className="px-1 text-body">{x.intro}</p>
      </Section>
      {x.sections.map((s) => (
        <Section key={s.h} title={s.h}>
          <ul className="list-disc space-y-2 pr-1 pl-6 text-body">{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
        </Section>
      ))}
      <Section>
        <p className="px-1 text-body">{fmt(x.contact, { email: "" })}<a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-cobalt">{SUPPORT_EMAIL}</a></p>
        <Link href="/support" className="flex min-h-11 items-center px-1 text-subhead font-semibold text-cobalt">{supportText(p.lang).title}</Link>
      </Section>
    </Screen>
  );
}
