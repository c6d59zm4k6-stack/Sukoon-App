// Recipe suggestions tied to the AI-generated plan's driver classification
// (profile.plan.typeProfile.mainDriver — the one structured field the PLAN
// JSON contract actually returns; there's no separate "diet type" field to
// match against, see planQuizPrompt.js's contract).
//
// 2026-08-25: the first version of this file linked out to a Zomato/Swiggy
// dish-name search (zomato.com/search?q=<dish>). Live testing found both
// apps intercept that link and land on their own generic homepage instead
// of search results — not useful, and not the actual goal anyway. The
// human's own words: "I was thinking to give options to eat the food as
// per their plan even if they are busy. That's the goal. Point is not
// generic link." So this now leads with real ordering-in/eating-out
// guidance (DRIVER_ORDERING_TIPS below) — what to actually pick from any
// menu to stay plan-appropriate on a busy day — with a plain, honest link
// to open the app to browse (ZOMATO/SWIGGY *do* reliably open from these,
// per the human's own test; they just don't deep-link to a specific
// search). Real "order this exact dish" ordering would still need an
// actual Zomato/Swiggy API partnership, out of reach for this pass.
export const DRIVER_ORDERING_TIPS = {
  "Insulin-driven": [
    "Pick grilled, steamed, or tandoori over anything fried or in a creamy gravy.",
    "Add a side salad, raita, or dal instead of extra rice or naan.",
    "Order last, not while browsing hungry — you're less likely to over-order sides.",
  ],
  "Gut-inflammation-driven": [
    "Ask for less oil and spice if bloating tends to flare up.",
    "Pick curd-based sides (raita, chaas) over anything cream- or butter-heavy.",
    "Skip deep-fried starters — they're the most common trigger for gut symptoms.",
  ],
  "Androgen-driven": [
    "Go for lean proteins — grilled fish, tandoori paneer or chicken — over fried snacks.",
    "Unsweetened lassi or nimbu pani instead of a sugary drink alongside the meal.",
  ],
  "Stress-driven": [
    "A simple warm meal (dal-rice, khichdi) sits easier before bed than something heavy.",
    "Order earlier in the evening rather than late at night if sleep is the focus.",
  ],
};
const GENERAL_ORDERING_TIPS = [
  "Pick grilled, steamed, or tandoori over fried where you can.",
  "A curd- or dal-based side is an easy, gentle add to almost any order.",
];

export function orderingTipsForPlan(plan) {
  const driver = plan?.typeProfile?.mainDriver;
  return DRIVER_ORDERING_TIPS[driver] || GENERAL_ORDERING_TIPS;
}

export const ZOMATO_URL = "https://www.zomato.com";
export const SWIGGY_URL = "https://www.swiggy.com";
export const RECIPES = [
  {
    id: "moong-dal-chilla",
    drivers: ["Insulin-driven"],
    name: "Moong Dal Chilla with Curd",
    summary: "A savoury lentil crepe — protein-forward, not just carbs, so it doesn't spike blood sugar the way a plain paratha would.",
    whyItHelps: "Pairing the carb (batter) with protein (dal + curd) is exactly the 'pair, don't skip' principle behind your plan's insulin-focused tips.",
    ingredients: [
      "1 cup moong dal, soaked 2–3 hrs",
      "1 small onion, finely chopped",
      "1 green chilli, chopped",
      "1/2 tsp cumin seeds",
      "Salt to taste",
      "1 tsp oil per chilla",
      "1/2 cup fresh curd, to serve",
    ],
    steps: [
      "Grind the soaked dal with a little water into a smooth, thick batter.",
      "Stir in onion, chilli, cumin, and salt.",
      "Heat a griddle, pour a ladle of batter and spread thin.",
      "Cook 2–3 min each side with a few drops of oil until golden.",
      "Serve hot with curd on the side.",
    ],
  },
  {
    id: "grilled-fish-greens",
    drivers: ["Insulin-driven"],
    name: "Grilled Fish with Sautéed Greens",
    summary: "Lean protein and fibre, minimal refined carbs.",
    whyItHelps: "A lower-carb dinner keeps insulin demand down through the evening — useful if cravings tend to hit at night.",
    ingredients: [
      "2 fish fillets (rohu, pomfret, or similar)",
      "1 tbsp curd",
      "1 tsp ginger-garlic paste",
      "1/2 tsp each turmeric and red chilli powder",
      "2 cups mixed greens (spinach, methi)",
      "1 clove garlic, sliced",
      "1 tsp oil",
    ],
    steps: [
      "Marinate the fish in curd, ginger-garlic paste, turmeric, and chilli powder for 20 minutes.",
      "Grill or pan-sear 3–4 min per side until cooked through.",
      "Sauté garlic in oil, add the greens, and cook 2–3 minutes until just wilted.",
      "Serve the fish over the sautéed greens.",
    ],
  },
  {
    id: "curd-rice-flaxseed",
    drivers: ["Gut-inflammation-driven"],
    name: "Curd Rice with a Spoon of Flaxseed",
    summary: "A classic South Indian comfort dish, with flaxseed stirred in for extra fibre.",
    whyItHelps: "Curd's probiotics and flaxseed's fibre both support gut health — directly relevant if bloating or IBS-type symptoms are part of your picture.",
    ingredients: [
      "1 cup cooked rice, cooled",
      "1 cup fresh curd",
      "1 tsp ground flaxseed",
      "1/2 tsp mustard seeds",
      "A few curry leaves",
      "Salt to taste",
    ],
    steps: [
      "Mash the cooled rice slightly and mix with curd and salt.",
      "Temper mustard seeds and curry leaves in a little oil, pour over the rice.",
      "Stir in the ground flaxseed just before serving.",
    ],
  },
  {
    id: "buttermilk-cucumber-salad",
    drivers: ["Gut-inflammation-driven"],
    name: "Buttermilk (Chaas) & Cucumber Salad",
    summary: "Cooling, probiotic-rich, and easy on digestion.",
    whyItHelps: "A good pairing after a heavier meal — buttermilk's probiotics support the same gut-health goal as your plan's daily curd habit.",
    ingredients: [
      "1 cup curd, whisked with water to buttermilk consistency",
      "1/2 tsp roasted cumin powder",
      "A pinch of black salt",
      "1 small cucumber, diced",
      "Fresh coriander or mint, chopped",
    ],
    steps: [
      "Whisk curd with water until smooth and pourable.",
      "Season with roasted cumin and black salt.",
      "Toss the diced cucumber with a little salt and herbs.",
      "Serve the chaas chilled alongside the cucumber salad.",
    ],
  },
  {
    id: "paneer-spinach-sabzi",
    drivers: ["Androgen-driven"],
    name: "Paneer & Spinach (Palak Paneer)",
    summary: "Iron-rich greens with protein.",
    whyItHelps: "Leafy greens like spinach are a source of magnesium, which plays a role in insulin sensitivity — relevant alongside the androgen overlay in your plan.",
    ingredients: [
      "200g paneer, cubed",
      "2 cups spinach, blanched and pureed",
      "1 onion, chopped",
      "1 tomato, pureed",
      "1 tsp ginger-garlic paste",
      "1/2 tsp garam masala",
      "1 tsp oil or ghee",
    ],
    steps: [
      "Sauté onion until golden, add ginger-garlic paste and tomato puree, cook until oil separates.",
      "Add the spinach puree and garam masala, simmer 5 minutes.",
      "Fold in paneer cubes and simmer 3–4 minutes more.",
      "Serve with a small portion of roti or rice.",
    ],
  },
  {
    id: "spearmint-tea-flax-toast",
    drivers: ["Androgen-driven"],
    name: "Spearmint Tea with Flaxseed Toast",
    summary: "A light snack pairing, not a meal on its own.",
    whyItHelps: "Spearmint tea and flaxseed are both specifically called out in your plan's notes for an androgen overlay — this is a simple way to actually work them in daily.",
    ingredients: [
      "1 tsp dried spearmint leaves (or a handful fresh)",
      "1 cup water",
      "1 slice whole-grain toast",
      "1 tsp ground flaxseed",
      "A drizzle of honey (optional)",
    ],
    steps: [
      "Steep spearmint in hot water for 5 minutes; strain.",
      "Toast the bread, sprinkle with ground flaxseed and a little honey if using.",
      "Enjoy the tea alongside.",
    ],
  },
  {
    id: "turmeric-milk",
    drivers: ["Stress-driven"],
    name: "Warm Turmeric Milk (Haldi Doodh)",
    summary: "A calming, screen-free wind-down ritual before bed.",
    whyItHelps: "Poor sleep raises cortisol and next-day cravings — a simple evening ritual like this supports the sleep-focused part of a stress-driven plan.",
    ingredients: [
      "1 cup milk (dairy or plant-based)",
      "1/4 tsp turmeric powder",
      "A pinch of black pepper",
      "1/2 tsp honey (optional)",
    ],
    steps: [
      "Warm the milk gently — don't let it boil.",
      "Whisk in turmeric and black pepper.",
      "Sweeten with honey if you like, and drink warm, ideally an hour before bed.",
    ],
  },
  {
    id: "overnight-oats-walnuts",
    drivers: ["Stress-driven"],
    name: "Overnight Oats with Walnuts",
    summary: "A steady-release breakfast with omega-3s from walnuts.",
    whyItHelps: "Omega-3s are linked to lower inflammation, and a steady-release breakfast avoids the energy dips that make stress harder to manage.",
    ingredients: [
      "1/2 cup rolled oats",
      "3/4 cup milk or curd",
      "1 tbsp chopped walnuts",
      "1/2 tsp chia seeds (optional)",
      "Fresh fruit, to top",
    ],
    steps: [
      "Mix oats, milk or curd, walnuts, and chia seeds in a jar.",
      "Cover and refrigerate overnight.",
      "Top with fresh fruit before eating in the morning.",
    ],
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
