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
    focus: "PCOS & perinatal mental health",
    matchLine: "PCOS care that makes room for mood, family expectations and unhurried decisions.",
    fitSignals: ["PCOS", "Hindi & Punjabi", "Perinatal mental health", "Women’s health"],
    practicalSignals: ["Bulk billing eligible", "22 min by tram", "Evening appointments"],
    about:
      "Maya supports women navigating PCOS, pregnancy planning, post-birth change and emotional wellbeing. She takes a collaborative, plain-language approach and is comfortable discussing how family expectations and culture can shape care.",
    experience: ["PCOS care", "Women’s health", "Perinatal mental health", "Reproductive health"],
    languages: ["English", "Hindi", "Punjabi"],
    appointmentLength: "Longer first appointments available",
    keywords: ["pcos", "polycystic", "woman", "female", "women", "young", "calm", "explain", "mental health", "perinatal", "anxiety", "mood", "hindi", "punjabi", "indian", "south asian", "cultural", "culture", "family"],
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
    focus: "Post-birth heart & metabolic health",
    matchLine: "Post-birth strength and heart-health support without weight-first assumptions.",
    fitSignals: ["Post-birth recovery", "Heart health", "Metabolic health"],
    practicalSignals: ["Mixed billing", "24 min by tram", "On-site pathology"],
    about:
      "Daniel supports women rebuilding strength, energy and confidence after birth while keeping heart and metabolic health in view. Plans are paced around recovery, sleep, body image and the realities of caring for a baby.",
    experience: ["Post-birth recovery", "Heart health", "Blood pressure", "Metabolic care plans"],
    languages: ["English", "Igbo"],
    appointmentLength: "Standard and longer appointments",
    keywords: ["post-birth", "post birth", "postpartum", "after birth", "strength", "energy", "heart", "cardiac", "cardiovascular", "blood pressure", "cholesterol", "body image", "bounce back", "weight", "ongoing"],
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
    focus: "Disability-rights & kidney-aware care",
    matchLine: "Disability-rights focused women’s care with Vietnamese language support.",
    fitSignals: ["Disability rights", "Vietnamese", "Kidney-aware care", "Women’s health"],
    practicalSignals: ["Bulk bills care plans", "27 min by train", "Wheelchair accessible"],
    about:
      "Linh supports disabled women and people managing kidney health through reproductive decisions, pregnancy and post-birth recovery. She centres consent, autonomy and accessible care, with clear explanations and coordinated follow-up.",
    experience: ["Disability-rights focused care", "Women’s health", "Kidney health", "Medication reviews"],
    languages: ["English", "Vietnamese"],
    appointmentLength: "Longer appointments available",
    keywords: ["disability", "disabled", "wheelchair", "accessible", "access", "rights", "autonomy", "consent", "advocate", "vietnamese", "post-birth", "post birth", "postpartum", "renal", "kidney", "nephrology", "chronic", "medication", "coordination"],
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
    focus: "Gestational diabetes & complex care",
    matchLine: "Arabic-language gestational diabetes support with calm hospital coordination.",
    fitSignals: ["Gestational diabetes", "Arabic", "Complex care", "Women’s health"],
    practicalSignals: ["Bulk billing eligible", "30 min by tram", "Wheelchair accessible"],
    about:
      "Aisha supports women managing gestational diabetes alongside kidney or other complex health needs. She works with hospital and community teams while keeping the patient’s preferences central to everyday care.",
    experience: ["Gestational diabetes", "Dialysis care", "Kidney health", "Hospital follow-up"],
    languages: ["English", "Arabic"],
    appointmentLength: "Longer appointments available",
    keywords: ["gestational diabetes", "pregnancy diabetes", "pregnant", "arabic", "woman", "women", "anxiety", "dialysis", "renal", "kidney", "hospital", "complex", "care team", "coordinate"],
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
    focus: "Neurodivergent women’s health",
    matchLine: "Structured PCOS and post-birth care that works with executive-function needs.",
    fitSignals: ["ADHD", "Post-birth care", "PCOS", "Clear plans"],
    practicalSignals: ["Mixed billing", "16 min by bike", "Telehealth follow-ups"],
    about:
      "Tom supports neurodivergent women managing PCOS, pregnancy transitions and post-birth overwhelm. Appointments use clear steps, realistic follow-up and shared-care coordination without moralising executive-function difficulty.",
    experience: ["ADHD care", "Women’s health", "PCOS support", "Shared care"],
    languages: ["English"],
    appointmentLength: "Standard and longer appointments",
    keywords: ["adhd", "attention", "neurodivergent", "executive function", "overwhelmed", "structured", "clear steps", "post-birth", "post birth", "postpartum", "pcos", "mental health", "shared care"],
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
    focus: "PCOS & gestational diabetes",
    matchLine: "Spanish-language metabolic care without weight stigma or unrealistic targets.",
    fitSignals: ["Gestational diabetes", "PCOS", "Spanish", "Weight-neutral care"],
    practicalSignals: ["Bulk bills", "12 min walk", "Saturday mornings"],
    about:
      "Sofia supports women navigating PCOS, gestational diabetes and post-birth metabolic health without reducing every concern to weight. She builds realistic plans around work, food, sleep, movement and emotional wellbeing.",
    experience: ["Gestational diabetes", "PCOS care", "Post-birth metabolic health", "Nutrition support"],
    languages: ["English", "Spanish"],
    appointmentLength: "Standard and longer appointments",
    keywords: ["pcos", "polycystic", "gestational diabetes", "pregnancy diabetes", "diabetes", "blood sugar", "post-birth", "post birth", "postpartum", "metabolic", "nutrition", "movement", "strength", "weight", "weight stigma", "body image", "non-judgemental", "without shame", "spanish"],
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
    focus: "Perinatal mental health",
    matchLine: "Gentle, trauma-aware support for anxiety and emotional recovery after birth.",
    fitSignals: ["Perinatal mental health", "Birth trauma", "Longer visits"],
    practicalSignals: ["Bulk billing eligible", "28 min by tram", "Telehealth available"],
    about:
      "Noah’s approach is calm and practical. He supports women experiencing anxiety, low mood, birth trauma or a changed sense of self during pregnancy and after birth as part of whole-person general practice care.",
    experience: ["Perinatal mental health", "Birth trauma", "Anxiety and mood", "Sleep"],
    languages: ["English"],
    appointmentLength: "Longer appointments available",
    keywords: ["mental health", "perinatal", "birth trauma", "trauma", "post-birth", "post birth", "postpartum", "after birth", "anxiety", "depression", "disconnected", "sleep", "gentle", "longer", "judgement"],
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
    focus: "PCOS, Tamil & Malayalam care",
    matchLine: "Tamil and Malayalam PCOS care with culturally responsive mental-health support.",
    fitSignals: ["PCOS", "Tamil & Malayalam", "South Indian context", "Mental health"],
    practicalSignals: ["Bulk bills", "18 min by tram", "Telehealth follow-ups"],
    about:
      "Priya supports young women navigating PCOS, pregnancy planning, mood changes and the pressure that health conversations can carry within South Indian families. She makes room for sensitive conversations and shared decisions without assumptions.",
    experience: ["PCOS care", "Women’s health", "Perinatal mental health", "Reproductive health"],
    languages: ["English", "Malayalam", "Tamil"],
    appointmentLength: "Longer first appointments available",
    keywords: ["pcos", "pmos", "polycystic", "south indian", "indian", "malayalam", "tamil", "cultural", "culture", "family", "family pressure", "woman", "women", "young", "mental health", "anxiety", "mood", "judgement"],
  },
];

export function rankClinicians(query: string): Clinician[] {
  const words = query.toLowerCase();
  const focusSignals: Record<string, Array<[string, number]>> = {
    "maya-singh": [["pcos", 20], ["pmos", 20], ["polycystic", 20], ["hindi", 26], ["punjabi", 26], ["family expectations", 16], ["family", 8], ["mental health", 12], ["anxiety", 10], ["calm", 12], ["explain", 10], ["south asian", 12]],
    "daniel-okafor": [["post-birth", 18], ["post birth", 18], ["postpartum", 18], ["strength", 22], ["energy", 18], ["cardiometabolic", 22], ["bounce back", 18], ["heart", 20], ["cardiac", 20], ["cardiovascular", 20], ["blood pressure", 14], ["cholesterol", 14]],
    "linh-nguyen": [["disability rights", 30], ["disabled", 24], ["wheelchair", 24], ["autonomy", 20], ["consent", 16], ["accessible", 18], ["vietnamese", 28], ["renal", 22], ["kidney", 22], ["nephrology", 22], ["medicines", 12]],
    "aisha-rahman": [["gestational diabetes", 26], ["pregnancy diabetes", 26], ["arabic", 28], ["complex", 14], ["hospital team", 18], ["coordinate", 14], ["dialysis", 24], ["renal", 14], ["kidney", 14]],
    "tom-bennett": [["adhd", 26], ["attention", 18], ["neurodivergent", 28], ["executive function", 24], ["clear steps", 18], ["overwhelmed", 12], ["shared care", 14]],
    "sofia-alvarez": [["gestational diabetes", 24], ["pregnancy diabetes", 24], ["spanish", 28], ["pcos", 22], ["pmos", 22], ["polycystic", 22], ["diabetes", 16], ["blood sugar", 16], ["metabolic", 18], ["weight stigma", 22], ["without shame", 18], ["weight", 10], ["sustainable", 14]],
    "noah-williams": [["birth trauma", 30], ["trauma", 22], ["perinatal", 24], ["post-birth", 12], ["post birth", 12], ["postpartum", 12], ["disconnected", 18], ["mental health", 18], ["anxiety", 16], ["depression", 16], ["gentle", 12], ["longer", 10]],
    "priya-nair": [["pcos", 22], ["pmos", 22], ["polycystic", 22], ["south indian", 28], ["malayalam", 28], ["tamil", 28], ["indian", 12], ["cultural", 14], ["culture", 14], ["family pressure", 18], ["family", 10], ["mental health", 14], ["anxiety", 10], ["woman", 8], ["young", 4]],
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
