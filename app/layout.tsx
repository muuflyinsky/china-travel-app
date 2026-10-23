import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/Shell";

export const metadata: Metadata = {
  title: "China Travel Buddy",
  description: "Menus, maps, metro, hotels and survival tools for travellers in China",
  manifest: "/manifest.webmanifest",
  // Opened from the iPhone home screen: full screen, no Safari bars.
  appleWebApp: { capable: true, title: "China Buddy", statusBarStyle: "default" },
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
