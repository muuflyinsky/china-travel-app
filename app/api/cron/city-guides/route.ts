import { NextResponse } from "next/server";
import { refreshStaleGuides } from "@/lib/city-guide";
import { setAmapGap } from "@/lib/amap";
import { supabaseOn } from "@/lib/supabase";
import { aiProvider, demo } from "@/lib/config";

// Daily Vercel Cron (vercel.json): generates the stalest city guides into Supabase, a few per run.
// Vercel calls it with `Authorization: Bearer $CRON_SECRET`; CITY_GUIDE_TOKEN works too, for a
// manual run (curl -H "authorization: Bearer …" https://…/api/cron/city-guides).
// Hobby plans allow one cron run a day and 300 s per function: new cities stop starting after
// 200 s, which leaves room for the last one (typically 60–110 s).
export const maxDuration = 300;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const allowed = [process.env.CRON_SECRET, process.env.CITY_GUIDE_TOKEN].filter(Boolean).map((s) => `Bearer ${s}`);
  if (!auth || !allowed.includes(auth)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!supabaseOn || demo.maps || !aiProvider) return NextResponse.json({ error: "needs Supabase, AMAP_KEY and an AI key" }, { status: 503 });
  setAmapGap(400); // ~2.5 Amap requests a second, under the key's QPS limit
  try {
    const result = await refreshStaleGuides({ budgetMs: 200_000 });
    return NextResponse.json(result);
  } finally {
    setAmapGap(0);
  }
}
