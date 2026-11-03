// Departure tax refund: where to claim it at the airports of the first three cities. Hand-checked
// against official sources (drafts/2026-11-03-离境退税指引-草稿.md in the workspace); only what a
// source states is filled in, anything else falls back to "follow the Tax Refund signs".
// Update VERIFIED_ON whenever you check, even if nothing changed. Users see this date.

export const VERIFIED_ON = "2026-11-03";

/** The official sign colour (Pantone 2945 C, 古蓝色) from MOFCOM's 退税商店 / 离境退税机构 sign specifications. */
export const SIGN_BLUE = "#004C97";

/** Where the refund agent's counter is, as far as an official source says. */
export type Counter = {
  /** e.g. "T2", "S1"; shown with the airport name. */
  terminal: string;
  floor?: number;
  /** After security, which way and how far. */
  walk?: { dir: "left" | "right"; m: number; then?: { dir: "left" | "right"; m: number } };
  /** A gate it is next to (or opposite: `opposite`). */
  gate?: string;
  opposite?: boolean;
  /** "24h", or from the first to the last international flight. */
  hours?: "24h" | "flights" | "0700";
  /** No official location yet: the page says to follow the signs. */
  signs?: true;
};

export type Airport = { code: string; zh: string; en: string; counters: Counter[] };
export type TaxCity = {
  adcode: string; airports: Airport[];
  /** Shanghai's free printed refund map. */ serviceMap?: boolean;
  /** Customs checks refunds at bag drop (Guangzhou Baiyun T2), so steps 1–3 happen at check-in. */ bagDropCheck?: boolean;
};

export const TAX_CITIES: TaxCity[] = [
  {
    adcode: "110000",
    airports: [
      // T3: Beijing 12345 service map (Beijing tax bureau data, 2025-05-16).
      { code: "PEK", zh: "北京首都国际机场", en: "Beijing Capital", counters: [{ terminal: "T3", floor: 4, hours: "24h" }, { terminal: "T2", signs: true }] },
      { code: "PKX", zh: "北京大兴国际机场", en: "Beijing Daxing", counters: [{ terminal: "", signs: true }] },
    ],
  },
  {
    adcode: "310000",
    serviceMap: true,
    airports: [
      // Shanghai tax bureau, "退税代理机构办理退税专用场所位置", published 2026-07-15.
      { code: "PVG", zh: "上海浦东国际机场", en: "Shanghai Pudong", counters: [
        { terminal: "T1", walk: { dir: "left", m: 500 }, gate: "19", hours: "24h" },
        { terminal: "T2", walk: { dir: "right", m: 200 }, gate: "D83", hours: "24h" },
        { terminal: "S1", floor: 3, gate: "G135", hours: "flights" },
        { terminal: "S2", floor: 3, gate: "G152", hours: "flights" },
      ] },
      { code: "SHA", zh: "上海虹桥国际机场", en: "Shanghai Hongqiao", counters: [{ terminal: "T1", walk: { dir: "right", m: 30, then: { dir: "right", m: 150 } }, gate: "T09", opposite: true, hours: "0700" }] },
    ],
  },
  {
    adcode: "440100",
    bagDropCheck: true,
    airports: [
      // Customs check is part of bag drop at T2 (Xinhua, 2026-07-08); counter locations not official yet.
      { code: "CAN", zh: "广州白云国际机场", en: "Guangzhou Baiyun", counters: [{ terminal: "T2", signs: true }, { terminal: "T3", signs: true }] },
    ],
  },
];

export const taxCity = (adcode: string) => TAX_CITIES.find((c) => c.adcode === adcode);
