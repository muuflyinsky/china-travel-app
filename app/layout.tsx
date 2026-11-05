import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/Shell";
import { SITE } from "@/lib/seo";

const title = "HaodeGo: China Travel Buddy";
const description = "Read Chinese menus with your allergies checked, get around, and pay in mainland China, in your language.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  // Pages set their own title; this adds the brand after it.
  title: { default: title, template: "%s · HaodeGo" },
  description,
  manifest: "/manifest.webmanifest",
  // Opened from the iPhone home screen: full screen, no Safari bars.
  appleWebApp: { capable: true, title: "HaodeGo", statusBarStyle: "default" },
  // Link previews in chats and social posts.
  alternates: { canonical: "/" },
  openGraph: { title, description, siteName: "HaodeGo", url: "/", type: "website" },
  twitter: { card: "summary", title, description },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#12141c" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // in-app is added before first paint inside the iOS app (user agent from capacitor.config.ts),
    // so globals.css can drop web-page behaviour there; the class isn't in the server HTML.
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: 'if(/ChinaTravelBuddy-iOS/.test(navigator.userAgent))document.documentElement.classList.add("in-app")' }} />
        {/* Dark before first paint (the saved choice, else the phone's), so the app never flashes white. */}
        <script dangerouslySetInnerHTML={{ __html: 'try{var t=(JSON.parse(localStorage.getItem("ctg.profile")||"{}").theme)||"system";if(t==="dark"||(t!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}' }} />
      </head>
      <body className="h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
