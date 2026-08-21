export const JOURNEYS = [
  { id: "pcos", emoji: "🌸", title: "PCOS Care", desc: "Manage PCOS, balance hormones & improve well-being" },
  { id: "fertility", emoji: "🪷", title: "Fertility & Trying to Conceive", desc: "Support for your fertility journey and conception" },
  { id: "mental", emoji: "🧠", title: "Mental Well-being", desc: "Sleep, anxiety, depression & habit change support" },
  { id: "nutrition", emoji: "🥗", title: "Nutrition & Lifestyle", desc: "Healthy eating, weight management & lifestyle guidance" },
  { id: "yoga", emoji: "🧘", title: "Yoga & Movement", desc: "Yoga, mindful movement & stress relief" },
  { id: "general", emoji: "🩺", title: "General Health", desc: "General consultations & everyday health" },
];

export function journeyById(id) {
  return JOURNEYS.find((j) => j.id === id);
}

export function journeyLabel(ids = []) {
  if (!ids.length) return "Your wellness journey";
  return ids.map((id) => journeyById(id)?.title).filter(Boolean).join(" · ");
}

export function journeyEmoji(ids = []) {
  return journeyById(ids[0])?.emoji ?? "🌿";
}
