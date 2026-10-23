// Visa-free entry rules by nationality (ordinary passports). Hand-maintained on purpose: this is
// a legal question with a right answer that changes, so it must never be guessed by a model.
//
// MAINTENANCE
// - Re-check every month against the National Immigration Administration (NIA) lists, and
//   without fail in mid-December: the unilateral policy currently ends on 2026-12-31.
// - Update VERIFIED_ON whenever you check, even if nothing changed. Users see this date.
// - The Before-you-go page and the stay countdown both read from this file.
//
// Status of this table: compiled on 2026-10-23 from the policy summary in the design review
// (NIA notices, gov.cn, Shanghai government, China Briefing). Country membership has NOT yet been
// checked line by line against the official NIA lists — do that before launch.

export const VERIFIED_ON = "2026-10-23";
export const SOURCE = { name: "National Immigration Administration", url: "https://en.nia.gov.cn" };

/** Unilateral visa-free entry: 30 days, business / tourism / family / exchange / transit. */
export const UNILATERAL_UNTIL = "2026-12-31";
const UNILATERAL = [
  "FR", "DE", "IT", "ES", "NL", "CH", "IE", "HU", "AT", "BE", "LU", "PL", "PT", "GR", "CY", "SI", "SK",
  "NO", "FI", "DK", "IS", "AD", "MC", "LI", "BG", "RO", "HR", "ME", "MK", "MT", "EE", "LV", "SE", "RU",
  "GB", "CA", "AU", "NZ", "JP", "KR", "BR", "AR", "CL", "PE", "UY", "SA", "OM", "KW", "BH",
];
/** Unilateral entries with no announced end date. */
const UNILATERAL_OPEN_ENDED = ["BN"];

/** Mutual visa exemption agreements: 30 days per entry, at most 90 days in any 180. */
const MUTUAL = [
  "SG", "TH", "MY", "AE", "QA", "RS", "BY", "GE", "KZ", "UZ", "MV", "MU", "SC", "BB", "BS", "GD", "FJ",
  "SM", "EC", "SR", "DM", "AG", "TO", "AL", "BA", "AM", "AZ", "SB",
];

/** 240-hour visa-free transit (to a third country, designated ports and provinces only). 57 countries. */
const TRANSIT_240 = [
  "AT", "BE", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "SK", "SI", "ES", "SE", "CH", "MC", "RU", "GB", "IE", "CY", "BG", "RO", "UA", "RS", "HR",
  "BA", "ME", "MK", "AL", "BY", "NO", "US", "CA", "BR", "MX", "AR", "CL", "AU", "NZ", "KR", "JP", "SG",
  "BN", "AE", "QA", "ID", "VN", "KG",
];

export type VisaRule =
  | { kind: "unilateral"; days: 30; until: string | null }
  | { kind: "mutual"; days: 30 }
  | { kind: "transit240"; days: 10 }
  | { kind: "visa" };

/** Best route for a nationality. `onwardThirdCountry` matters only for transit-only countries. */
export function visaRule(country: string, onwardThirdCountry: boolean | null): VisaRule & { transitOnly: boolean } {
  const c = country.toUpperCase();
  if (UNILATERAL.includes(c)) return { kind: "unilateral", days: 30, until: UNILATERAL_UNTIL, transitOnly: false };
  if (UNILATERAL_OPEN_ENDED.includes(c)) return { kind: "unilateral", days: 30, until: null, transitOnly: false };
  if (MUTUAL.includes(c)) return { kind: "mutual", days: 30, transitOnly: false };
  if (TRANSIT_240.includes(c)) {
    return onwardThirdCountry === false ? { kind: "visa", transitOnly: true } : { kind: "transit240", days: 10, transitOnly: true };
  }
  return { kind: "visa", transitOnly: false };
}

/** Entry type for the stay countdown, derived from the rule. */
export function entryTypeFor(rule: VisaRule): "visa_free_30" | "transit_240" | "visa" {
  return rule.kind === "transit240" ? "transit_240" : rule.kind === "visa" ? "visa" : "visa_free_30";
}

export const COUNTS = { unilateral: UNILATERAL.length + UNILATERAL_OPEN_ENDED.length, mutual: MUTUAL.length, transit240: TRANSIT_240.length };

// ---- nationality guess -------------------------------------------------------------------

const TZ_COUNTRY: Record<string, string> = {
  "Europe/Paris": "FR", "Europe/Berlin": "DE", "Europe/Madrid": "ES", "Europe/Rome": "IT", "Europe/Amsterdam": "NL",
  "Europe/London": "GB", "Europe/Dublin": "IE", "Europe/Zurich": "CH", "Europe/Vienna": "AT", "Europe/Brussels": "BE",
  "Europe/Stockholm": "SE", "Europe/Oslo": "NO", "Europe/Copenhagen": "DK", "Europe/Helsinki": "FI", "Europe/Warsaw": "PL",
  "Europe/Lisbon": "PT", "Europe/Athens": "GR", "Europe/Moscow": "RU", "Asia/Tokyo": "JP", "Asia/Seoul": "KR",
  "Asia/Singapore": "SG", "Asia/Bangkok": "TH", "Asia/Kuala_Lumpur": "MY", "Asia/Dubai": "AE", "Asia/Jakarta": "ID",
  "Asia/Ho_Chi_Minh": "VN", "Asia/Manila": "PH", "Asia/Kolkata": "IN", "Australia/Sydney": "AU", "Australia/Melbourne": "AU",
  "Pacific/Auckland": "NZ", "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US", "America/Los_Angeles": "US",
  "America/Toronto": "CA", "America/Vancouver": "CA", "America/Mexico_City": "MX", "America/Sao_Paulo": "BR",
  "America/Argentina/Buenos_Aires": "AR", "America/Santiago": "CL", "America/Lima": "PE",
};

/** Guess nationality from the browser's locale region, then its time zone. Always confirmed by the user. */
export function guessCountry(): string | null {
  for (const l of navigator.languages ?? [navigator.language]) {
    const region = l.split("-")[1];
    if (region && /^[A-Z]{2}$/i.test(region)) return region.toUpperCase();
  }
  return TZ_COUNTRY[Intl.DateTimeFormat().resolvedOptions().timeZone] ?? null;
}

// ---- home currency from nationality ------------------------------------------------------

const EURO = ["AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK", "AD", "MC", "SM", "ME"];
const CURRENCY: Record<string, string> = {
  US: "USD", GB: "GBP", JP: "JPY", KR: "KRW", AU: "AUD", CA: "CAD", SG: "SGD", HK: "HKD", CH: "CHF", TH: "THB",
  MY: "MYR", NZ: "NZD", SE: "SEK", IN: "INR", BR: "BRL", MX: "MXN", RU: "RUB", TR: "TRY", ID: "IDR", VN: "VND", PH: "PHP",
};
export const currencyFor = (country: string) => (EURO.includes(country) ? "EUR" : CURRENCY[country] ?? "USD");

/** ISO 3166-1 alpha-2 codes for the country picker (names come from Intl.DisplayNames). */
export const COUNTRIES = (
  "AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CO CR CU CV CY CZ " +
  "DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HN HR HT HU ID IE IL IN IQ IR IS IT JM JO " +
  "JP KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MR MT MU MV MW MX MY MZ NA NE " +
  "NG NI NL NO NP NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD " +
  "TG TH TJ TL TM TN TO TR TT TV TZ UA UG US UY UZ VA VC VE VN VU WS YE ZA ZM ZW"
).split(" ");
