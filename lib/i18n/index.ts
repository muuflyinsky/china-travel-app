import { en, type Dict } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { de } from "./de";
import { ja } from "./ja";
import { ko } from "./ko";

/** Languages with a translated interface. Menus and Talk support every language in LANGUAGES. */
export const UI_DICTS: Record<string, Dict> = { en, es, fr, de, ja, ko };

export function getDict(lang: string): Dict {
  return UI_DICTS[lang] ?? en;
}

export const hasUi = (lang: string) => lang in UI_DICTS;

export function fmt(s: string, vars: Record<string, string | number>) {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export type { Dict };
