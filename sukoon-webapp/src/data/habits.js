import { Salad, Droplet, Footprints, Brain } from "lucide-react";

// The single source of truth for the 4 daily habits — shared by Track
// (where they're actually logged) and Plan (which just displays today's
// completion). Previously these were two separate hardcoded mocks that
// could silently disagree; now there's one definition and one state.
export const HABITS = [
  { id: "meals", label: "Eat balanced meals", Icon: Salad },
  { id: "water", label: "Drink more water", Icon: Droplet },
  { id: "walk", label: "Walk / Move 10 min", Icon: Footprints },
  { id: "mindcare", label: "Mind care moment", Icon: Brain },
];

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function lastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}
