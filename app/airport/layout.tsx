import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/airport", "From the airport to your hotel in China", "The first hour after landing in Beijing, Shanghai or Xi'an: getting online, checking Alipay, and three ways into town.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
