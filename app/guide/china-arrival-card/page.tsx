// The online arrival card (since 2025-11-20). Facts from Chinese embassy notices, as collected in the
// workspace (inbox/2026-11-04-product-修复方案与新需求.md §F); the link is the one the app uses (app/page.tsx).
import type { Metadata } from "next";
import { GuidePage, G } from "@/components/site/GuidePage";

const PATH = "/guide/china-arrival-card";
const ARRIVAL_CARD_URL = "https://s.nia.gov.cn/ArrivalCardFillingPhone/";
const title = "China arrival card online: the free official form";
const description =
  "Foreign visitors can fill in China’s arrival card on their phone before landing. Where the official form is, that it’s free, how to avoid paid look-alike sites, and what to do if you didn’t fill it in.";

export const metadata: Metadata = {
  title: `${title} | HaodeGo`,
  description,
  alternates: { canonical: PATH },
  openGraph: { title, description, url: PATH, siteName: "HaodeGo", type: "article" },
};

export default function ArrivalCardGuide() {
  return (
    <GuidePage
      path={PATH}
      title={title}
      intro="Since 20 November 2025, foreign visitors can fill in China’s arrival card online before they travel, instead of on paper at the airport. It takes a few minutes and costs nothing."
      checked="4 November 2026"
      appHelps="Before your trip, HaodeGo’s home screen links straight to the official form, next to your visa-free check and the rest of your preparation."
      sources={[
        { name: "Embassy of China in the US: notice on the online arrival card (3 Dec 2025)", url: "https://us.china-embassy.gov.cn/eng/lsfw/zj/notice/202512/t20251203_11765346.htm" },
        { name: "Embassy of China in Indonesia: notice (1 Dec 2025)", url: "https://id.china-embassy.gov.cn/lsfw/zytz_0/202512/t20251201_11764061.htm" },
      ]}
    >
      <G h="Where to fill it in">
        <p>Use one of the official channels of China’s National Immigration Administration (NIA):</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            The NIA website on your phone:{" "}
            <a href={ARRIVAL_CARD_URL} rel="noopener" className="font-semibold text-cobalt">s.nia.gov.cn arrival card form</a>
          </li>
          <li>The “移民局12367” (NIA 12367) app</li>
          <li>The NIA mini program inside WeChat or Alipay</li>
        </ul>
      </G>

      <G h="It’s free: watch out for look-alike sites">
        <p>The official form doesn’t charge anything. The immigration agency has warned about fake websites that ask for a fee. If a site asks you to pay, close it and use one of the official channels above.</p>
      </G>

      <G h="Didn’t fill it in before you flew?">
        <p>That’s fine. When you arrive you can still fill it in at the port, by scanning a QR code or at the machines there, and paper cards are still available.</p>
      </G>

      <G h="Who doesn’t need one">
        <p>Most visitors do. Among the exceptions, the ones that matter to independent travellers are people travelling on a group visa or group visa-free entry, and passengers on a direct transit of up to 24 hours who don’t leave the airport.</p>
      </G>
    </GuidePage>
  );
}
