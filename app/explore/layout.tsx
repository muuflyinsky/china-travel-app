import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/explore", "Explore: places near you in China", "Find restaurants, sights, metro stations, pharmacies and hospitals near you in Chinese cities, with names in pinyin and a card to show your driver.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
