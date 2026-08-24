// Recipe suggestions tied to the AI-generated plan's driver classification
// (profile.plan.typeProfile.mainDriver — the one structured field the PLAN
// JSON contract actually returns; there's no separate "diet type" field to
// match against, see planQuizPrompt.js's contract). Restaurant links are
// "search this dish near you", same pattern as experts.js's clinicMapsUrl —
// not real ordering, which would need an actual Zomato/Swiggy API
// partnership, out of reach for this pass.
export const RECIPES = [
  {
    id: "moong-dal-chilla",
    drivers: ["Insulin-driven"],
    name: "Moong Dal Chilla with Curd",
    dishQuery: "moong dal chilla",
    summary: "A savoury lentil crepe — protein-forward, not just carbs, so it doesn't spike blood sugar the way a plain paratha would.",
    whyItHelps: "Pairing the carb (batter) with protein (dal + curd) is exactly the 'pair, don't skip' principle behind your plan's insulin-focused tips.",
  },
  {
    id: "grilled-fish-greens",
    drivers: ["Insulin-driven"],
    name: "Grilled Fish with Sautéed Greens",
    dishQuery: "grilled fish tikka",
    summary: "Lean protein and fibre, minimal refined carbs.",
    whyItHelps: "A lower-carb dinner keeps insulin demand down through the evening — useful if cravings tend to hit at night.",
  },
  {
    id: "curd-rice-flaxseed",
    drivers: ["Gut-inflammation-driven"],
    name: "Curd Rice with a Spoon of Flaxseed",
    dishQuery: "curd rice",
    summary: "A classic South Indian comfort dish, with flaxseed stirred in for extra fibre.",
    whyItHelps: "Curd's probiotics and flaxseed's fibre both support gut health — directly relevant if bloating or IBS-type symptoms are part of your picture.",
  },
  {
    id: "buttermilk-cucumber-salad",
    drivers: ["Gut-inflammation-driven"],
    name: "Buttermilk (Chaas) & Cucumber Salad",
    dishQuery: "masala chaas",
    summary: "Cooling, probiotic-rich, and easy on digestion.",
    whyItHelps: "A good pairing after a heavier meal — buttermilk's probiotics support the same gut-health goal as your plan's daily curd habit.",
  },
  {
    id: "paneer-spinach-sabzi",
    drivers: ["Androgen-driven"],
    name: "Paneer & Spinach (Palak Paneer)",
    dishQuery: "palak paneer",
    summary: "Iron-rich greens with protein.",
    whyItHelps: "Leafy greens like spinach are a source of magnesium, which plays a role in insulin sensitivity — relevant alongside the androgen overlay in your plan.",
  },
  {
    id: "spearmint-tea-flax-toast",
    drivers: ["Androgen-driven"],
    name: "Spearmint Tea with Flaxseed Toast",
    dishQuery: "spearmint tea",
    summary: "A light snack pairing, not a meal on its own.",
    whyItHelps: "Spearmint tea and flaxseed are both specifically called out in your plan's notes for an androgen overlay — this is a simple way to actually work them in daily.",
  },
  {
    id: "turmeric-milk",
    drivers: ["Stress-driven"],
    name: "Warm Turmeric Milk (Haldi Doodh)",
    dishQuery: "haldi doodh",
    summary: "A calming, screen-free wind-down ritual before bed.",
    whyItHelps: "Poor sleep raises cortisol and next-day cravings — a simple evening ritual like this supports the sleep-focused part of a stress-driven plan.",
  },
  {
    id: "overnight-oats-walnuts",
    drivers: ["Stress-driven"],
    name: "Overnight Oats with Walnuts",
    dishQuery: "overnight oats",
    summary: "A steady-release breakfast with omega-3s from walnuts.",
    whyItHelps: "Omega-3s are linked to lower inflammation, and a steady-release breakfast avoids the energy dips that make stress harder to manage.",
  },
];

// A small, driver-agnostic set shown before an AI plan exists yet (e.g. the
// skip-to-fallback path), so the section still has something real to show
// instead of being empty or misleadingly matched.
const GENERAL_RECIPES = ["moong-dal-chilla", "curd-rice-flaxseed", "overnight-oats-walnuts"];

export function recipesForPlan(plan) {
  const driver = plan?.typeProfile?.mainDriver;
  if (!driver) return RECIPES.filter((r) => GENERAL_RECIPES.includes(r.id));
  const matches = RECIPES.filter((r) => r.drivers.includes(driver));
  return matches.length ? matches : RECIPES.filter((r) => GENERAL_RECIPES.includes(r.id));
}

export function zomatoSearchUrl(dishQuery) {
  return `https://www.zomato.com/search?q=${encodeURIComponent(dishQuery)}`;
}

export function swiggySearchUrl(dishQuery) {
  return `https://www.swiggy.com/search?query=${encodeURIComponent(dishQuery)}`;
}
