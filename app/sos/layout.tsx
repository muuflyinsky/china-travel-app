import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/sos", "Emergency help in China", "Emergency numbers in mainland China (110 police, 120 ambulance, 119 fire), finding a hospital, and what to do if you lose your passport.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
