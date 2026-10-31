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
    <html lang="en" className="h-full">
      <body className="h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
