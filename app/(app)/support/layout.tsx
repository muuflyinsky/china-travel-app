import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/support", "Help and contact", "Questions about HaodeGo or a problem with the app: how to reach us.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
