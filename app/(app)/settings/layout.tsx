import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/settings", "Settings", "Your languages, allergies, travel dates and cities. Stored on your phone only.", { noindex: true });

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
