import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/menu", "Read a Chinese menu with your allergies checked", "Photograph a Chinese menu or type a dish name to see what it is, what is usually in it, and a warning if it may contain your allergens.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
