"use client";
import { Screen } from "@/components/Shell";
import { Section } from "@/components/ui";
import { DriverPanel } from "@/components/DriverPanel";
import { useT } from "@/components/useT";

/** "Show the driver" as its own page (from Talk), the same content as Today's sheet. */
export default function DriverPage() {
  const t = useT();
  return (
    <Screen title={t.today.tileDriver} back>
      <Section>
        <DriverPanel />
      </Section>
    </Screen>
  );
}
