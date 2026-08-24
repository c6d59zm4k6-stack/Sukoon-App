// Sukoon's content library — short educational tips/articles, tagged by
// journey so Home can surface only what's relevant to what someone
// actually picked (as opposed to a generic feed), and so a journey-matched
// deep link (e.g. from an Instagram bio link) can land someone on content
// that speaks to them specifically. Same mock-data fidelity as the rest of
// the app — real copy, no backend, focused on PCOS since that's the only
// journey actually live end-to-end (see ChooseJourney's ENABLED_JOURNEYS).
export const CONTENT_ITEMS = [
  {
    id: "pcos-insulin-101",
    journeyIds: ["pcos"],
    category: "Understanding PCOS",
    title: "Insulin Resistance & PCOS, Explained Simply",
    readTime: "4 min read",
    summary: "Why blood sugar swings are often the real driver behind PCOS symptoms — and the one lever that moves the most.",
    body: `Insulin resistance means your body needs more insulin than usual to keep blood sugar steady. Over time, that extra insulin can push your ovaries to make more androgens (like testosterone) — which is where a lot of PCOS symptoms actually come from: irregular periods, acne, and stubborn weight around the middle.

The good news: insulin resistance responds fast to small, consistent changes. Pairing carbs with protein or fibre, walking after meals, and getting enough sleep all measurably lower insulin — often within weeks, well before weight changes show up.

This is also why Sukoon's plan leans so heavily on "pair, don't skip" eating and post-meal walks — they're not generic wellness advice, they're targeted at the actual mechanism.`,
  },
  {
    id: "pcos-period-irregular",
    journeyIds: ["pcos"],
    category: "Understanding PCOS",
    title: "Why Your Period Might Be Irregular",
    readTime: "3 min read",
    summary: "Irregular doesn't always mean something is wrong — but it's worth understanding what's actually happening.",
    body: `A "regular" cycle is usually 21–35 days. With PCOS, higher androgen levels can interfere with ovulation, so a cycle might stretch to 40+ days, skip entirely some months, or show up unpredictably.

This isn't just inconvenient — it also means your body may be getting less regular progesterone, which is one reason PCOS is often managed with a combination of lifestyle changes and, sometimes, medication to help regulate cycles.

Logging your period dates (even roughly) on the Track tab helps Sukoon build a real picture of your pattern over time — that history is genuinely useful context to bring to a doctor's appointment.`,
  },
  {
    id: "pcos-foods-hormones",
    journeyIds: ["pcos"],
    category: "Food & Nutrition",
    title: "5 Foods That Help Balance Hormones",
    readTime: "3 min read",
    summary: "Small, realistic swaps — not a restrictive diet — that support insulin and hormone balance.",
    body: `1. Curd/yoghurt daily — supports gut health, which is increasingly linked to hormone regulation.
2. Flaxseeds — a source of lignans that may help balance excess androgens; a spoon a day is enough.
3. Leafy greens (palak, methi) — high in magnesium, which plays a role in insulin sensitivity.
4. Cinnamon — some evidence it modestly improves insulin sensitivity when used regularly in food.
5. Fatty fish or walnuts — omega-3s are linked to lower inflammation, which matters for PCOS.

None of these are a fix on their own — they work alongside the bigger picture (carb pairing, movement, sleep) rather than replacing it.`,
  },
  {
    id: "pcos-sleep-connection",
    journeyIds: ["pcos"],
    category: "Lifestyle",
    title: "PCOS and Sleep: What's the Connection?",
    readTime: "3 min read",
    summary: "Poor sleep doesn't just make PCOS symptoms feel worse — it can actually worsen insulin resistance itself.",
    body: `Even a few nights of short or poor-quality sleep measurably reduce insulin sensitivity — meaning your body needs more insulin to do the same job, which is exactly the mechanism behind a lot of PCOS symptoms.

Sleep also affects cortisol and appetite hormones, which is part of why poor sleep is linked to more sugar cravings the next day — not a willpower problem, a hormonal one.

If sleep has been rough, that's worth mentioning the next time you check in on Track — it's genuinely relevant context, not a separate issue.`,
  },
  {
    id: "general-post-meal-walk",
    journeyIds: [],
    category: "Everyday Habits",
    title: "Why a Short Walk After Eating Works So Well",
    readTime: "2 min read",
    summary: "One of the simplest, best-evidenced habits in this entire plan.",
    body: `A 10–15 minute walk after a meal measurably blunts the blood sugar spike that follows eating — your muscles pull glucose out of the bloodstream directly, without needing as much insulin.

This matters more than most people expect: studies comparing "walk after eating" to "same amount of walking, different time of day" consistently find the post-meal timing works better for blood sugar specifically.

It doesn't need to be a workout — a slow walk to the end of the street and back counts. Consistency beats intensity here.`,
  },
  {
    id: "general-stress-body",
    journeyIds: [],
    category: "Mind & Body",
    title: "How Stress Shows Up in the Body, Not Just the Mind",
    readTime: "3 min read",
    summary: "Chronic stress has real physical effects — worth knowing, not just feeling.",
    body: `Ongoing stress keeps cortisol elevated, which can raise blood sugar, increase cravings for quick energy (usually sugar/refined carbs), and disrupt sleep — all of which feed back into each other.

None of this means stress is "just in your head" or that symptoms are imagined — it means the mind-body connection here is a real physiological loop, not a metaphor.

Small, regular practices — a few minutes of slow breathing, a short walk, or just naming what you're feeling to someone (or to Sukoon) — measurably lower cortisol over time. It doesn't have to be a big ritual to count.`,
  },
];

export function contentForJourneys(journeyIds = [], limit) {
  const set = new Set(journeyIds);
  const matches = CONTENT_ITEMS.filter(
    (item) => item.journeyIds.length === 0 || item.journeyIds.some((j) => set.has(j))
  );
  return limit ? matches.slice(0, limit) : matches;
}

export function contentById(id) {
  return CONTENT_ITEMS.find((item) => item.id === id);
}
