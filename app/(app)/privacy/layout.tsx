import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/privacy", "Privacy", "What HaodeGo stores on your phone, what it sends to our servers, and what it never collects.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
