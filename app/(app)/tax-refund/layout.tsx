import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/tax-refund", "Tax refund for tourists in China", "How to get the departure tax refund in mainland China: the Tax Free signs to look for and the steps at the airport.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
