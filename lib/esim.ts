import type { AppId } from "./apps";

// Travel eSIMs that route data through a roaming partner, so Google, WhatsApp, Instagram etc.
// keep working in mainland China. Each provider runs its own affiliate programme (mostly via
// Impact, CJ or PartnerStack): paste the tracking link it gives you into ESIM_<ID>_URL.
export type EsimProvider = {
  id: "tripcom" | "airalo" | "holafly" | "saily" | "nomad" | "klook";
  app: AppId;
  /** i18n keys under t.esim.features */
  features: ("unlimited" | "perGb" | "topUp" | "tripAccount" | "byNord" | "airportPickup")[];
  defaultUrl: string;
};

export const ESIM_PROVIDERS: EsimProvider[] = [
  { id: "holafly", app: "holafly", features: ["unlimited"], defaultUrl: "https://esim.holafly.com/esim-china/" },
  { id: "airalo", app: "airalo", features: ["perGb", "topUp"], defaultUrl: "https://www.airalo.com/china-esim" },
  { id: "saily", app: "saily", features: ["perGb", "byNord"], defaultUrl: "https://saily.com/esim-china/" },
  { id: "nomad", app: "nomad", features: ["perGb", "topUp"], defaultUrl: "https://www.getnomad.app/" },
  { id: "tripcom", app: "tripcom", features: ["tripAccount"], defaultUrl: "https://www.trip.com/things-to-do/list?keyword=China%20eSIM" },
  { id: "klook", app: "klook", features: ["airportPickup"], defaultUrl: "https://www.klook.com/search/result/?query=china%20esim" },
];
