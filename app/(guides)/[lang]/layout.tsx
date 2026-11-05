import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../../globals.css";
import { LANGS, isLang } from "@/lib/guides";
import { SITE } from "@/lib/seo";

// Root layout for the static guides, separate from the app's (app/(app)/layout.tsx) so each page
// carries its own <html lang> and none of the app shell's client code.

export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "HaodeGo guides", template: "%s · HaodeGo" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#12141c" },
  ],
};

export default async function GuidesRoot({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* Same theme as the app (saved choice, else the phone's), before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: 'try{var t=(JSON.parse(localStorage.getItem("ctg.profile")||"{}").theme)||"system";if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}' }} />
      </head>
      <body className="min-h-full bg-porcelain text-ink">{children}</body>
    </html>
  );
}
