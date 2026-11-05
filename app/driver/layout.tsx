import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/driver", "Show the driver where you are going", "Search a place in your city and show the taxi driver its name and address in Chinese, with buttons for Amap and DiDi.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
