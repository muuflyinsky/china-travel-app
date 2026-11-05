import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/talk", "Show-to-staff cards and translation", "Translate what you want to say into Chinese and show ready-made cards to taxi drivers, waiters and hotel staff.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
