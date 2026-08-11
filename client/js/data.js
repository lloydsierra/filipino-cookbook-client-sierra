// js/data.js
// ---------------------------------------------------------------------------
// Data shapes, lookups, and small transform helpers. No fetch() here — this
// file only shapes data that api.js already retrieved (or, for origins,
// data that isn't retrievable at all).
// ---------------------------------------------------------------------------

// There is no GET /api/origins endpoint. Origins are a fixed, tiny table
// (see database/filipino_foods_relational.sql) so they're shipped here.
export const ORIGINS = [
  { origin_id: 1, origin_name: 'Bacolod' },
  { origin_id: 2, origin_name: 'Bicol Region' },
  { origin_id: 3, origin_name: 'Ilocos Region' },
  { origin_id: 4, origin_name: 'Philippines' },
];

// Each category is tagged with a color pulled from the ingredient or method
// that defines it — annatto for grilling, ube for dessert, and so on —
// rather than an arbitrary palette. Used for the recipe-card tab and the
// category swatches.
export const CATEGORY_COLORS = {
  1: { hex: '#8FA31E', label: 'kalamansi' }, // Appetizer
  2: { hex: '#6B4A8A', label: 'ube' },        // Dessert
  3: { hex: '#B33A1F', label: 'atsuete' },    // Grilled Dish
  4: { hex: '#6B4226', label: 'adobo' },      // Main Dish
  5: { hex: '#C77F1E', label: 'kasubha' },    // Noodle Dish
  6: { hex: '#2F5D50', label: 'bagoong' },    // Soup
  7: { hex: '#4C7A57', label: 'saging' },     // Vegetable Dish
};
const DEFAULT_CATEGORY_COLOR = { hex: '#8C6A4A', label: 'kusina' };

// Categories only come from the API, so they're cached here once fetched.
let categoriesCache = null;

export function setCategoriesCache(list) {
  categoriesCache = Array.isArray(list) ? list : null;
}

export function getCategoriesCache() {
  return categoriesCache;
}

export function resolveOriginName(id) {
  const found = ORIGINS.find((o) => String(o.origin_id) === String(id));
  return found ? found.origin_name : 'Unknown origin';
}

export function resolveCategoryName(id) {
  if (!categoriesCache) return `Category ${id}`;
  const found = categoriesCache.find((c) => String(c.category_id) === String(id));
  return found ? found.category_name : `Category ${id}`;
}

export function categoryColor(id) {
  return CATEGORY_COLORS[id] || DEFAULT_CATEGORY_COLOR;
}

/** Attaches human-readable names + a display color to a raw food record. */
export function enrichFood(food) {
  return {
    ...food,
    category_name: resolveCategoryName(food.category_id),
    origin_name: resolveOriginName(food.origin_id),
    category_color: categoryColor(food.category_id).hex,
  };
}

/**
 * GET /api/foods/search/{name} omits the `ingredients` array entirely.
 * This guarantees callers always get an array so the UI never crashes.
 */
export function normalizeIngredientList(food) {
  return Array.isArray(food.ingredients) ? food.ingredients : [];
}
