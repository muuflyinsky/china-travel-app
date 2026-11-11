import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta("/stay", "Hotels that accept foreign guests", "Hotels in Chinese cities that usually accept foreign guests, by price, with the nearest metro line.");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
