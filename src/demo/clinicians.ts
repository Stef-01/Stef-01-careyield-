export type Clinician = {
  id: string;
  name: string;
  shortName: string;
  pronouns: string;
  title: string;
  suburb: string;
  distance: string;
  image: string;
  nextAvailable: string;
  acceptingNewPatients: boolean;
  focus: string;
  matchLine: string;
  fitSignals: string[];
  practicalSignals: string[];
  about: string;
  experience: string[];
  languages: string[];
  appointmentLength: string;
  keywords: string[];
};

export const clinicians: Clinician[] = [
  {
    id: "maya-singh",
    name: "Dr Maya Singh",
    shortName: "Dr Singh",
    pronouns: "she/her",
    title: "General practitioner",
    suburb: "North Fitzroy",
    distance: "1.4 km away",
    image: "/clinicians/maya-singh.png",
    nextAvailable: "Tuesday, 10:20 am",
    acceptingNewPatients: true,
    focus: "PCOS & women’s health",
    matchLine: "PCOS and women’s mental-health experience. Calm, unhurried appointments.",
    fitSignals: ["PCOS", "South Asian care", "Mental health", "Women’s health"],
    practicalSignals: ["Bulk billing eligible", "22 min by tram", "Evening appointments"],
    about:
      "Maya supports young women navigating PCOS, reproductive health and emotional wellbeing. She takes a collaborative, plain-language approach and is comfortable discussing how family expectations and culture can shape care.",
    experience: ["PCOS care", "Women’s health", "Mental health", "Reproductive health"],
    languages: ["English", "Hindi", "Punjabi"],
    appointmentLength: "Longer first appointments available",
    keywords: ["pcos", "polycystic", "woman", "female", "women", "young", "calm", "explain", "mental health", "anxiety", "mood", "indian", "south asian", "cultural", "culture", "family"],
  },
  {
    id: "daniel-okafor",
    name: "Dr Daniel Okafor",
    shortName: "Dr Okafor",
    pronouns: "he/him",
    title: "General practitioner",
    suburb: "Carlton North",
    distance: "2.1 km away",
    image: "/clinicians/daniel-okafor.png",
    nextAvailable: "Monday, 3:40 pm",
    acceptingNewPatients: true,
    focus: "Heart health focus",
    matchLine: "Heart health focus. Clear plans for ongoing care.",
    fitSignals: ["Heart health", "Care plans", "Longer visits"],
    practicalSignals: ["Mixed billing", "24 min by tram", "On-site pathology"],
    about:
      "Daniel works with adults who want steady, practical support for heart health and long-term risk factors, in coordination with their wider care team.",
    experience: ["Heart health", "Blood pressure", "Cholesterol", "Ongoing care plans"],
    languages: ["English", "Igbo"],
    appointmentLength: "Standard and longer appointments",
    keywords: ["heart", "cardiac", "cardiovascular", "blood pressure", "cholesterol", "ongoing"],
  },
  {
    id: "linh-nguyen",
    name: "Dr Linh Nguyen",
    shortName: "Dr Nguyen",
    pronouns: "she/her",
    title: "General practitioner",
    suburb: "Richmond",
    distance: "3.3 km away",
    image: "/clinicians/linh-nguyen.png",
    nextAvailable: "Wednesday, 9:00 am",
    acceptingNewPatients: true,
    focus: "Kidney health focus",
    matchLine: "Kidney health focus. Thoughtful long-term care planning.",
    fitSignals: ["Kidney health", "Medication review", "Care coordination"],
    practicalSignals: ["Bulk bills care plans", "27 min by train", "Wheelchair accessible"],
    about:
      "Linh supports people managing kidney health alongside other long-term conditions, with an emphasis on clear explanations and coordinated follow-up.",
    experience: ["Kidney health", "Chronic conditions", "Medication reviews", "Care coordination"],
    languages: ["English", "Vietnamese"],
    appointmentLength: "Longer appointments available",
    keywords: ["renal", "kidney", "nephrology", "chronic", "medication", "coordination"],
  },
  {
    id: "aisha-rahman",
    name: "Dr Aisha Rahman",
    shortName: "Dr Rahman",
    pronouns: "she/her",
    title: "General practitioner",
    suburb: "Brunswick",
    distance: "3.8 km away",
    image: "/clinicians/aisha-rahman.png",
    nextAvailable: "Thursday, 11:10 am",
    acceptingNewPatients: true,
    focus: "Dialysis care experience",
    matchLine: "Dialysis care experience. Comfortable coordinating complex care.",
    fitSignals: ["Dialysis", "Kidney health", "Complex care"],
    practicalSignals: ["Bulk billing eligible", "30 min by tram", "Wheelchair accessible"],
    about:
      "Aisha has experience supporting people receiving dialysis and works closely with hospital and community teams to keep everyday care joined up.",
    experience: ["Dialysis care", "Kidney health", "Complex care", "Hospital follow-up"],
    languages: ["English", "Arabic"],
    appointmentLength: "Longer appointments available",
    keywords: ["dialysis", "renal", "kidney", "hospital", "complex", "care team"],
  },
  {
    id: "tom-bennett",
    name: "Dr Tom Bennett",
    shortName: "Dr Bennett",
    pronouns: "he/him",
    title: "General practitioner",
    suburb: "Collingwood",
    distance: "1.9 km away",
    image: "/clinicians/tom-bennett.png",
    nextAvailable: "Tuesday, 4:30 pm",
    acceptingNewPatients: true,
    focus: "ADHD care experience",
    matchLine: "ADHD care experience. Structured, low-pressure appointments.",
    fitSignals: ["ADHD", "Mental health", "Shared care"],
    practicalSignals: ["Mixed billing", "16 min by bike", "Telehealth follow-ups"],
    about:
      "Tom supports adults with ADHD as part of ongoing general practice care, including shared-care coordination, medication reviews and everyday wellbeing.",
    experience: ["ADHD care", "Shared care", "Mental health", "Medication reviews"],
    languages: ["English"],
    appointmentLength: "Standard and longer appointments",
    keywords: ["adhd", "attention", "neurodivergent", "structured", "mental health", "shared care"],
  },
  {
    id: "sofia-alvarez",
    name: "Dr Sofia Alvarez",
    shortName: "Dr Alvarez",
    pronouns: "she/her",
    title: "General practitioner",
    suburb: "Fitzroy",
    distance: "900 m away",
    image: "/clinicians/sofia-alvarez.png",
    nextAvailable: "Friday, 8:40 am",
    acceptingNewPatients: true,
    focus: "PCOS & metabolic health",
    matchLine: "PCOS and metabolic health focus. Practical, non-judgemental care.",
    fitSignals: ["PCOS", "Metabolic health", "Nutrition support"],
    practicalSignals: ["Bulk bills", "12 min walk", "Saturday mornings"],
    about:
      "Sofia supports people who want to understand the metabolic side of PCOS without having every concern reduced to weight. She builds realistic plans around work, food, sleep and other priorities.",
    experience: ["PCOS care", "Metabolic health", "Diabetes care", "Nutrition support"],
    languages: ["English", "Spanish"],
    appointmentLength: "Standard and longer appointments",
    keywords: ["pcos", "polycystic", "diabetes", "blood sugar", "metabolic", "nutrition", "weight", "non-judgemental", "spanish"],
  },
  {
    id: "noah-williams",
    name: "Dr Noah Williams",
    shortName: "Dr Williams",
    pronouns: "he/him",
    title: "General practitioner",
    suburb: "Northcote",
    distance: "4.2 km away",
    image: "/clinicians/noah-williams.png",
    nextAvailable: "Wednesday, 1:20 pm",
    acceptingNewPatients: true,
    focus: "Mental health focus",
    matchLine: "Mental health focus. Gentle, judgement-free conversations.",
    fitSignals: ["Mental health", "Longer visits", "Judgement-free"],
    practicalSignals: ["Bulk billing eligible", "28 min by tram", "Telehealth available"],
    about:
      "Noah’s approach is calm and practical. He supports adults with mental wellbeing concerns as part of whole-person general practice care.",
    experience: ["Mental health", "Men’s health", "Sleep", "Preventive care"],
    languages: ["English"],
    appointmentLength: "Longer appointments available",
    keywords: ["mental health", "anxiety", "depression", "sleep", "men", "judgement"],
  },
  {
    id: "priya-nair",
    name: "Dr Priya Nair",
    shortName: "Dr Nair",
    pronouns: "she/her",
    title: "General practitioner",
    suburb: "Parkville",
    distance: "2.7 km away",
    image: "/clinicians/priya-nair.png",
    nextAvailable: "Monday, 9:30 am",
    acceptingNewPatients: true,
    focus: "PCOS & cultural care",
    matchLine: "PCOS expertise with culturally responsive mental-health care.",
    fitSignals: ["PCOS", "South Indian context", "Mental health", "Women’s health"],
    practicalSignals: ["Bulk bills", "18 min by tram", "Telehealth follow-ups"],
    about:
      "Priya supports young women navigating PCOS, mood changes and the pressure that health conversations can carry within South Indian families. She makes room for sensitive conversations and shared decisions without assumptions.",
    experience: ["PCOS care", "Women’s health", "Mental health", "Reproductive health"],
    languages: ["English", "Malayalam", "Tamil"],
    appointmentLength: "Longer first appointments available",
    keywords: ["pcos", "polycystic", "south indian", "indian", "malayalam", "tamil", "cultural", "culture", "family", "woman", "women", "young", "mental health", "anxiety", "mood"],
  },
];

export function rankClinicians(query: string): Clinician[] {
  const words = query.toLowerCase();
  const focusSignals: Record<string, Array<[string, number]>> = {
    "maya-singh": [["pcos", 18], ["polycystic", 18], ["women", 9], ["woman", 9], ["female", 9], ["mental health", 10], ["anxiety", 8], ["south asian", 9], ["indian", 7], ["cultural", 7], ["calm", 10]],
    "daniel-okafor": [["heart", 18], ["cardiac", 18], ["cardiovascular", 18], ["blood pressure", 14], ["cholesterol", 14]],
    "linh-nguyen": [["renal", 18], ["kidney", 18], ["nephrology", 18]],
    "aisha-rahman": [["dialysis", 22]],
    "tom-bennett": [["adhd", 20], ["attention", 16], ["neurodivergent", 16], ["shared care", 14]],
    "sofia-alvarez": [["pcos", 18], ["polycystic", 18], ["diabetes", 18], ["blood sugar", 16], ["metabolic", 16], ["weight", 10]],
    "noah-williams": [["mental health", 16], ["anxiety", 14], ["depression", 14], ["sleep", 12]],
    "priya-nair": [["pcos", 20], ["polycystic", 20], ["south indian", 22], ["malayalam", 20], ["tamil", 20], ["indian", 12], ["cultural", 12], ["culture", 12], ["family", 10], ["mental health", 12], ["anxiety", 10], ["women", 8], ["woman", 8], ["young", 4]],
  };

  return [...clinicians].sort((a, b) => {
    const score = (clinician: Clinician) => {
      const focusScore = (focusSignals[clinician.id] ?? []).reduce(
        (total, [keyword, weight]) => total + (words.includes(keyword) ? weight : 0),
        0,
      );
      const mannerScore = clinician.keywords.reduce(
        (total, keyword) => total + (words.includes(keyword) ? 2 : 0),
        0,
      );
      return focusScore + mannerScore;
    };

    return score(b) - score(a);
  });
}
