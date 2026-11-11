"use client";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Screen } from "@/components/Shell";
import { Section, Card } from "@/components/ui";
import { useProfile } from "@/components/useProfile";
import { supportText, SUPPORT_EMAIL } from "@/lib/legal";

/** Help and support: the App Store's support URL (haodego.com/support). */
export default function SupportPage() {
  const [p] = useProfile();
  const x = supportText(p.lang);
  const [before, after] = x.contactBody.split("{email}");
  return (
    <Screen title={x.title} back>
      <Section title={x.contactH}>
        <Card>
          <p className="text-body">{before}<a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-cobalt">{SUPPORT_EMAIL}</a>{after}</p>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cobalt px-4 text-headline text-white dark:text-[#12141c]">
            <Mail className="h-5 w-5" aria-hidden />{SUPPORT_EMAIL}
          </a>
        </Card>
      </Section>
      <Section title={x.faqH}>
        {x.faq.map((f) => (
          <Card key={f.q}>
            <h3 className="text-headline">{f.q}</h3>
            <p className="mt-1 text-body text-muted">{f.a}</p>
          </Card>
        ))}
      </Section>
      <Section>
        <Link href="/privacy" className="flex min-h-11 items-center px-1 text-subhead font-semibold text-cobalt">{x.privacy}</Link>
      </Section>
    </Screen>
  );
}
