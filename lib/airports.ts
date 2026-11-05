// The first hour: from the airport to the hotel (and back, on the last day). Written like
// lib/tax-refund.ts: only what an official source ([官]) or a mainstream news report ([媒]) states,
// from the research in the workspace `inbox/2026-11-04-product-修复方案与新需求.md` §C 附.
// Anything only a third-party guide says, or that nobody states, is left out and the page says
// "follow the signs" instead. Prices and times are always shown as "about". Check twice a year.
// Update VERIFIED_ON whenever you check, even if nothing changed. Users see this date.

export const VERIFIED_ON = "2026-11-04";

/** A name as it appears on the signs: English and Chinese. */
export type Name = { en: string; zh: string };

/**
 * How to pay for the metro:
 * - card: Visa / Mastercard / JCB / Amex tap at the gates (Beijing, incl. the airport lines) [官 2024-09]
 * - cardPilot: foreign cards in a pilot that needs contactless small payments without a PIN (Shanghai) [媒]
 * - alipay: no official word on cards: Alipay's transport QR code or a single-journey ticket
 * - ticket: buy a ticket at the station
 */
export type Pay = "card" | "cardPilot" | "alipay" | "ticket";

export type Metro = {
  line: Name;
  /** Where it goes in town, as the sign says. */
  to?: Name;
  /** The airport station, when its name differs from the airport's. */
  from?: Name;
  /** Terminals it stops at, when not all of them. */
  at?: string;
  mins?: number;
  cny?: number;
  pay: Pay;
  /** Extra line, a key of t.airport.notes. */
  note?: NoteKey;
};

/** "T1 arrivals level, outside door 12". */
export type Door = { t: string; door: string };
/** "Car park P1, level B2". */
export type Park = { park: string; floor?: string };

export type Taxi = {
  doors?: Door[];
  /** Where the doors list isn't the right shape, a key of t.airport.notes. */
  note?: NoteKey;
  /** To `to` (or the city centre): about this many yuan, a range when given. */
  cny?: [number, number?];
  mins?: number;
  to?: Name;
  /** Some taxis take foreign cards (PVG) [媒]. */
  someCards?: boolean;
};

export type Ride = { parks?: Park[]; note?: NoteKey };

export type NoteKey =
  | "maglevHours" | "pekRide" | "pkxTaxi" | "pkxRide" | "xiyIntl" | "pvgOnline" | "pvgMoney";

export type ArrivalAirport = {
  code: string;
  /** The city it serves (adcode). */
  city: string;
  name: Name;
  /** For the driver card on the way out; "" when there's one terminal. */
  terminals: string[];
  metro: Metro[];
  /** Missing = nothing official: the page says follow the 出租车 Taxi signs. */
  taxi?: Taxi;
  /** Missing = follow the 网约车 signs or the pick-up point DiDi suggests. */
  ride?: Ride;
  /** Lines under "Get online" / "Money" in the first-things-first list. */
  online?: NoteKey;
  money?: NoteKey;
  /** Shown under the airport name. */
  note?: NoteKey;
};

const BJ = "110000", SH = "310000", XA = "610100";

export const AIRPORTS: ArrivalAirport[] = [
  {
    // Line and fare: Beijing Subway [官]. Cards on every line incl. the airport line [官 2024-09].
    // Ride-hailing B2 → B1 after the car-park works end late November [媒 2026-09]. Taxi: nothing official.
    code: "PEK", city: BJ, name: { en: "Beijing Capital", zh: "北京首都国际机场" }, terminals: ["T2", "T3"],
    metro: [{ line: { en: "Capital Airport Express", zh: "首都机场线" }, to: { en: "Dongzhimen", zh: "东直门" }, cny: 25, pay: "card" }],
    ride: { note: "pekRide" },
  },
  {
    // Line, time, fare [媒]; kerbside taxis [官]; ride-hailing from 2026-09-15 [媒]; cards [官].
    code: "PKX", city: BJ, name: { en: "Beijing Daxing", zh: "北京大兴国际机场" }, terminals: [],
    metro: [{ line: { en: "Daxing Airport Express", zh: "大兴机场线" }, to: { en: "Caoqiao", zh: "草桥" }, mins: 19, cny: 35, pay: "card" }],
    taxi: { note: "pkxTaxi" },
    ride: { note: "pkxRide" },
  },
  {
    // Line 2 [官]; Maglev [媒]; taxi doors, fare, time [官]; some taxis take cards [媒];
    // card pilot on the metro [媒]; SIM / Wi-Fi / exchange in the arrivals baggage hall [官 2026-04];
    // passport Wi-Fi kiosks [媒]; ATMs for the five card networks in T2 [官].
    // Ride-hailing pick-up: reports conflict, left out until checked.
    code: "PVG", city: SH, name: { en: "Shanghai Pudong", zh: "上海浦东国际机场" }, terminals: ["T1", "T2"],
    metro: [
      { line: { en: "Metro Line 2", zh: "地铁2号线" }, to: { en: "People’s Square", zh: "人民广场" }, mins: 60, cny: 7, pay: "cardPilot" },
      { line: { en: "Maglev", zh: "磁浮" }, to: { en: "Longyang Road", zh: "龙阳路" }, mins: 8, cny: 50, pay: "ticket", note: "maglevHours" },
    ],
    taxi: { doors: [{ t: "T1", door: "12" }, { t: "T2", door: "25" }], cny: [180], mins: 50, to: { en: "People’s Square", zh: "人民广场" }, someCards: true },
    online: "pvgOnline", money: "pvgMoney",
  },
  {
    // Lines [官]; taxi doors, time, fare [官]; ride-hailing car parks [媒]; card pilot [媒].
    code: "SHA", city: SH, name: { en: "Shanghai Hongqiao", zh: "上海虹桥国际机场" }, terminals: ["T1", "T2"],
    metro: [
      { line: { en: "Metro Line 10", zh: "地铁10号线" }, at: "T1, T2", pay: "cardPilot" },
      { line: { en: "Metro Line 2", zh: "地铁2号线" }, at: "T2", pay: "cardPilot" },
    ],
    taxi: { doors: [{ t: "T1", door: "1" }, { t: "T2", door: "4" }], cny: [100, 150], mins: 30 },
    ride: { parks: [{ park: "P1", floor: "B2" }, { park: "P6" }, { park: "P7" }] },
  },
  {
    // International flights all at T5 since 2025-02 [媒]; Line 14 station 机场(T5).
    // The change to Line 2 for the Bell Tower is only in guides: left out. Card payment, taxi and
    // ride-hailing points: nothing official.
    code: "XIY", city: XA, name: { en: "Xi’an Xianyang", zh: "西安咸阳国际机场" }, terminals: ["T5"],
    metro: [{ line: { en: "Metro Line 14", zh: "地铁14号线" }, from: { en: "Airport (T5)", zh: "机场(T5)" }, pay: "alipay" }],
    note: "xiyIntl",
  },
];

export const AIRPORT_CITIES = [BJ, SH, XA];

export const airportsIn = (adcode: string) => AIRPORTS.filter((a) => a.city === adcode);
export const airportByCode = (code: string) => AIRPORTS.find((a) => a.code === code);

/** The Chinese card for the driver on the way out: "please take me to … T2 international departures". */
export function toAirportLines(a: ArrivalAirport, terminal: string) {
  return ["师傅您好，请带我去：", `${a.name.zh}${terminal ? ` ${terminal}` : ""}`, "国际出发"];
}
