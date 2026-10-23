import { NextResponse } from "next/server";

/** A feature has no key configured (production) — shown as "temporarily unavailable". */
export class Unavailable extends Error {
  constructor(public feature: "ai" | "map") { super(`${feature} is not configured`); }
}

/** The model answered, but not in the expected shape — shown as "couldn't read it, try again". */
export class Unreadable extends Error {}

/** One error format for every API route: 503 unavailable, 422 unreadable, 502 upstream failure. */
export function errorResponse(e: unknown, where: string) {
  if (e instanceof Unavailable) {
    console.error(`[${where}] unavailable: ${e.message}`);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  if (e instanceof Unreadable) {
    console.error(`[${where}] unreadable: ${e.message}`);
    return NextResponse.json({ error: "unreadable" }, { status: 422 });
  }
  console.error(`[${where}]`, e);
  return NextResponse.json({ error: (e as Error).message ?? "error" }, { status: 502 });
}
