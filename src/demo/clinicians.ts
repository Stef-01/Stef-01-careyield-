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
    focus: "Women’s health focus",
    matchLine: "Calm, unhurried appointments. Women’s health focus.",
    about:
      "Maya takes a collaborative, plain-language approach and leaves time for questions. Her practice interests include women’s health across life stages.",
    experience: ["Women’s health", "Contraception", "Perimenopause", "Preventive care"],
    languages: ["English", "Hindi", "Punjabi"],
    appointmentLength: "Standard and longer appointments",
    keywords: ["woman", "female", "women", "patient", "calm", "explain", "menopause", "contraception"],
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
    focus: "Diabetes care focus",
    matchLine: "Diabetes care focus. Practical support that fits daily life.",
    about:
      "Sofia enjoys helping people make sense of diabetes care and build realistic plans around work, family, food and other priorities.",
    experience: ["Diabetes care", "Metabolic health", "Preventive care", "Care plans"],
    languages: ["English", "Spanish"],
    appointmentLength: "Standard and longer appointments",
    keywords: ["diabetes", "blood sugar", "metabolic", "nutrition", "preventive", "spanish"],
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
    focus: "Older-person care focus",
    matchLine: "Older-person care focus. Clear support for patients and families.",
    about:
      "Priya supports older adults and their families with medication reviews, changing care needs and coordinated follow-up across services.",
    experience: ["Older-person care", "Medication reviews", "Memory concerns", "Care coordination"],
    languages: ["English", "Malayalam"],
    appointmentLength: "Longer appointments available",
    keywords: ["older", "elderly", "geriatric", "memory", "family", "medication", "care coordination"],
  },
];

export function rankClinicians(query: string): Clinician[] {
  const words = query.toLowerCase();
  const focusSignals: Record<string, string[]> = {
    "maya-singh": ["women", "woman", "female", "menopause", "contraception"],
    "daniel-okafor": ["heart", "cardiac", "cardiovascular", "blood pressure", "cholesterol"],
    "linh-nguyen": ["renal", "kidney", "nephrology"],
    "aisha-rahman": ["dialysis"],
    "tom-bennett": ["adhd", "attention", "neurodivergent", "shared care"],
    "sofia-alvarez": ["diabetes", "blood sugar", "metabolic"],
    "noah-williams": ["mental health", "anxiety", "depression", "sleep"],
    "priya-nair": ["older", "elderly", "geriatric", "memory"],
  };

  return [...clinicians].sort((a, b) => {
    const score = (clinician: Clinician) => {
      const focusScore = (focusSignals[clinician.id] ?? []).reduce(
        (total, keyword) => total + (words.includes(keyword) ? 12 : 0),
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
