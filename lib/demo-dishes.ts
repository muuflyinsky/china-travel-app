// Sample menu as a stream and per-dish details, for development without an AI key.
import { menu } from "./demo";
import type { ListDish, DishDetail, MenuEvent } from "./dishes";

const list = (d: (typeof menu.dishes)[number]): ListDish => ({
  zh: d.original, pinyin: d.pinyin, price: d.price, name: d.translated, short: d.description.split(/[.,—]/)[0],
  allergens: d.allergens.map((id) => {
    const ing = d.ingredients.find((x) => x.allergens.includes(id));
    return { id, role: ing?.role ?? "main", via: ing?.name.toLowerCase() ?? id, via_zh: ing?.zh ?? "" };
  }),
  spice: d.spice_level, vegetarian: d.vegetarian, meat: d.meat, alcohol: d.contains_alcohol, confidence: d.confidence,
});

export async function* demoMenu(): AsyncGenerator<MenuEvent> {
  yield { type: "meta", cuisine: menu.restaurant_type, total: menu.dishes.length };
  for (const [i, d] of menu.dishes.entries()) {
    await new Promise((r) => setTimeout(r, 350)); // so the dish-by-dish rendering can be seen
    yield { type: "dish", i, dish: list(d), cached: false };
  }
  yield { type: "tips", tips: menu.tips };
}

export function demoDetail(zh: string): DishDetail | null {
  const d = menu.dishes.find((x) => x.original === zh);
  return d ? { literal: d.literal, description: d.description, notes: d.notes, ingredients: d.ingredients } : null;
}
