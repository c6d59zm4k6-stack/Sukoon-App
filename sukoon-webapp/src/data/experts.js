// Shared roster — used by both the Care tab's browse UI (Experts.jsx) and
// the "Not sure whom to consult?" AI concierge, so the concierge can only
// ever recommend a real doctor from this exact list (never invent one).
export const SPECIALTIES = [
  { id: "gynae", emoji: "🌸", title: "Gynaecology & Women's Health", desc: "PCOS, periods, hormones, women's well-being" },
  { id: "fertility", emoji: "🎯", title: "Fertility", desc: "Conception, IVF, IUI, trying to conceive" },
  { id: "psychiatry", emoji: "🧠", title: "Psychiatry", desc: "Anxiety, depression, sleep, stress, habit change" },
  { id: "nutrition", emoji: "🌱", title: "Nutrition", desc: "Diet plans, gut health, weight & lifestyle" },
];

export const EXPERTS = [
  {
    name: "Dr. Deepika Verma",
    role: "Gynaecologist, Reproductive Specialist",
    specialties: ["gynae", "fertility"],
    tags: ["PCOS", "Fertility", "Hormonal Health"],
    verified: true,
    rating: "4.9 (120)",
    avail: "Available today",
    hours: "10:00 AM – 6:00 PM",
    gender: "female",
    experienceYears: 12,
    fee: "₹800",
    distanceKm: 4,
  },
  {
    name: "Dr. Aditi Sharma",
    role: "MD, Psychiatrist",
    specialties: ["psychiatry"],
    tags: ["Anxiety", "Depression", "Stress", "Sleep"],
    verified: true,
    rating: "4.9 (110)",
    avail: "Available today",
    hours: "4:00 PM – 8:00 PM",
    gender: "female",
    experienceYears: 8,
    fee: "₹700",
    distanceKm: 6,
  },
  {
    name: "Priyanka Dey",
    role: "Nutritionist",
    specialties: ["nutrition"],
    tags: ["PCOS", "Weight Management", "Gut Health"],
    verified: true,
    rating: "4.8 (88)",
    avail: "Available tomorrow",
    hours: "11:00 AM – 7:00 PM",
    gender: "female",
    experienceYears: 7,
    fee: "₹500",
    distanceKm: 3,
  },
];

// Real single location for now — phone left blank until the human provides
// one (the "Call" option only renders once CLINIC.phone is set).
export const CLINIC = {
  name: "Woodhouse Healthcare Speciality Clinic",
  address: "Nehru Chowk, Bhopal",
  hours: "9 AM – 7 PM",
  phone: "9109698953",
};

export function clinicMapsUrl() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CLINIC.name + ", " + CLINIC.address)}`;
}

export function formatPhone(phone) {
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
}

export function expertByName(name) {
  return EXPERTS.find((e) => e.name === name);
}
