import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/Shell";

const title = "HaodeGo: China Travel Buddy";
const description = "Read Chinese menus with your allergies checked, get around, and pay in mainland China, in your language.";

export const metadata: Metadata = {
  metadataBase: new URL("https://haodego.com"),
  title,
  description,
  manifest: "/manifest.webmanifest",
  // Opened from the iPhone home screen: full screen, no Safari bars.
  appleWebApp: { capable: true, title: "HaodeGo", statusBarStyle: "default" },
  // Link previews in chats and social posts.
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
      </head>
      <body className="h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
