"use client";
import { useEffect, useState } from "react";
import { inApp } from "@/lib/passes";

/** True inside the iOS app, after mount (the server can't know). For layout, prefer the .web-only / .app-only classes. */
export function useInApp() {
  const [app, setApp] = useState(false);
  useEffect(() => setApp(inApp()), []);
  return app;
}
