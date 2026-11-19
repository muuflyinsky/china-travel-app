import type { Metadata } from "next";
import "./globals.css";

// Needed because the app and the guides have separate root layouts (app/(app), app/(guides)).
export const metadata: Metadata = { title: "Page not found · HaodeGo", robots: { index: false } };

export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body className="grid min-h-screen place-items-center bg-porcelain p-gutter text-ink">
        <main className="max-w-sm text-center">
          <h1 className="text-title">Page not found</h1>
          <p className="mt-2 text-body text-muted">This page doesn’t exist or has moved.</p>
          <a href="/" className="mt-section inline-flex min-h-control items-center rounded-control bg-cobalt px-5 text-subhead font-semibold text-white">Open HaodeGo</a>
        </main>
      </body>
    </html>
  );
}
