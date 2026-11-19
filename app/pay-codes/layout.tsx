import { pageMeta } from "@/lib/seo";

// Reached from Today in the iOS app (D19); not a search landing page.
export const metadata = pageMeta("/pay-codes", "Pay in China", "Open your Alipay or WeChat Pay code and what to do if paying doesn't work.", { noindex: true });

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
