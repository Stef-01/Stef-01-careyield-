import type { CareArchetype } from "./care-archetypes";

export type Clinician = {
  id: string;
  name: string;
  shortName: string;
  gender: "woman" | "man" | "non-binary";
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
  careAreas: string[];
  wheelchairAccessible: boolean;
  appointmentLength: string;
  keywords: string[];
};

export const clinicians: Clinician[] = [
  {
    id: "maya-singh",
    name: "Dr Maya Singh",
    shortName: "Dr Singh",
    gender: "woman",
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
    careAreas: ["pcos", "perinatal-mental-health", "post-birth"],
    wheelchairAccessible: false,
    appointmentLength: "Longer first appointments available",
    keywords: ["pcos", "polycystic", "woman", "female", "women", "young", "calm", "explain", "mental health", "perinatal", "anxiety", "mood", "hindi", "punjabi", "indian", "south asian", "cultural", "culture", "family"],
  },
  {
    id: "daniel-okafor",
    name: "Dr Daniel Okafor",
    shortName: "Dr Okafor",
    gender: "man",
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
    careAreas: ["post-birth", "metabolic", "cardiac"],
    wheelchairAccessible: false,
    appointmentLength: "Standard and longer appointments",
    keywords: ["post-birth", "post birth", "postpartum", "after birth", "strength", "energy", "heart", "cardiac", "cardiovascular", "blood pressure", "cholesterol", "body image", "bounce back", "weight", "ongoing"],
  },
  {
    id: "linh-nguyen",
    name: "Dr Linh Nguyen",
    shortName: "Dr Nguyen",
    gender: "woman",
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
    careAreas: ["disability-rights", "kidney", "post-birth"],
    wheelchairAccessible: true,
    appointmentLength: "Longer appointments available",
    keywords: ["disability", "disabled", "wheelchair", "accessible", "access", "rights", "autonomy", "consent", "advocate", "vietnamese", "post-birth", "post birth", "postpartum", "renal", "kidney", "nephrology", "chronic", "medication", "coordination"],
  },
  {
    id: "aisha-rahman",
    name: "Dr Aisha Rahman",
    shortName: "Dr Rahman",
    gender: "woman",
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
    careAreas: ["gestational-diabetes", "kidney", "dialysis"],
    wheelchairAccessible: true,
    appointmentLength: "Longer appointments available",
    keywords: ["gestational diabetes", "pregnancy diabetes", "pregnant", "arabic", "woman", "women", "anxiety", "dialysis", "renal", "kidney", "hospital", "complex", "care team", "coordinate"],
  },
  {
    id: "tom-bennett",
    name: "Dr Tom Bennett",
    shortName: "Dr Bennett",
    gender: "man",
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
    careAreas: ["adhd", "post-birth", "pcos"],
    wheelchairAccessible: false,
    appointmentLength: "Standard and longer appointments",
    keywords: ["adhd", "attention", "neurodivergent", "executive function", "overwhelmed", "structured", "clear steps", "post-birth", "post birth", "postpartum", "pcos", "mental health", "shared care"],
  },
  {
    id: "sofia-alvarez",
    name: "Dr Sofia Alvarez",
    shortName: "Dr Alvarez",
    gender: "woman",
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
    careAreas: ["pcos", "gestational-diabetes", "post-birth", "metabolic"],
    wheelchairAccessible: false,
    appointmentLength: "Standard and longer appointments",
    keywords: ["pcos", "polycystic", "gestational diabetes", "pregnancy diabetes", "diabetes", "blood sugar", "post-birth", "post birth", "postpartum", "metabolic", "nutrition", "movement", "strength", "weight", "weight stigma", "body image", "non-judgemental", "without shame", "spanish"],
  },
  {
    id: "noah-williams",
    name: "Dr Noah Williams",
    shortName: "Dr Williams",
    gender: "man",
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
    careAreas: ["perinatal-mental-health", "post-birth"],
    wheelchairAccessible: false,
    appointmentLength: "Longer appointments available",
    keywords: ["mental health", "perinatal", "birth trauma", "trauma", "post-birth", "post birth", "postpartum", "after birth", "anxiety", "depression", "disconnected", "sleep", "gentle", "longer", "judgement"],
  },
  {
    id: "priya-nair",
    name: "Dr Priya Nair",
    shortName: "Dr Nair",
    gender: "woman",
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
    careAreas: ["pcos", "perinatal-mental-health"],
    wheelchairAccessible: false,
    appointmentLength: "Longer first appointments available",
    keywords: ["pcos", "pmos", "polycystic", "south indian", "indian", "malayalam", "tamil", "cultural", "culture", "family", "family pressure", "woman", "women", "young", "mental health", "anxiety", "mood", "judgement"],
  },
  {
    id: "anjali-menon",
    name: "Dr Anjali Menon",
    shortName: "Dr Menon",
    gender: "woman",
    pronouns: "she/her",
    title: "General practitioner",
    suburb: "Coburg",
    distance: "4.1 km away",
    image: "/clinicians/anjali-menon.png",
    nextAvailable: "Tuesday, 12:30 pm",
    acceptingNewPatients: true,
    focus: "PCOS, metabolic & reproductive mental health",
    matchLine: "Tamil and Malayalam PCOS support with culturally aware conversations about mood and family.",
    fitSignals: ["PCOS", "Tamil & Malayalam", "Mental health", "Women’s health"],
    practicalSignals: ["Bulk billing eligible", "25 min by tram", "Long first visits"],
    about:
      "Anjali works with women managing PCOS, metabolic health, reproductive decisions and emotional wellbeing. She supports sensitive conversations about family expectations while keeping the patient’s own goals and privacy central.",
    experience: ["PCOS care", "Metabolic health", "Reproductive mental health", "Shared decision-making"],
    languages: ["English", "Malayalam", "Tamil"],
    careAreas: ["pcos", "metabolic", "perinatal-mental-health"],
    wheelchairAccessible: false,
    appointmentLength: "Longer first appointments available",
    keywords: ["pcos", "polycystic", "metabolic", "sustainable", "healthier", "south indian", "malayalam", "tamil", "woman", "women", "mental health", "anxiety", "mood", "family", "culture", "cultural", "explain", "unhurried"],
  },
  {
    id: "nisha-kapoor",
    name: "Dr Nisha Kapoor",
    shortName: "Dr Kapoor",
    gender: "woman",
    pronouns: "she/her",
    title: "General practitioner",
    suburb: "Preston",
    distance: "4.8 km away",
    image: "/clinicians/nisha-kapoor.png",
    nextAvailable: "Wednesday, 3:10 pm",
    acceptingNewPatients: true,
    focus: "PCOS, mood & family context",
    matchLine: "Hindi and Punjabi PCOS care with calm explanations and space for family dynamics.",
    fitSignals: ["PCOS", "Hindi & Punjabi", "Mental health", "Longer visits"],
    practicalSignals: ["Bulk bills care plans", "29 min by train", "Evening appointments"],
    about:
      "Nisha supports PCOS and reproductive-health care alongside anxiety, low mood and difficult family conversations. She uses clear options and checks understanding without rushing decisions.",
    experience: ["PCOS care", "Women’s health", "Anxiety and mood", "Reproductive health"],
    languages: ["English", "Hindi", "Punjabi"],
    careAreas: ["pcos", "perinatal-mental-health"],
    wheelchairAccessible: false,
    appointmentLength: "Standard and longer appointments",
    keywords: ["pcos", "polycystic", "hindi", "punjabi", "woman", "women", "mental health", "anxiety", "anxious", "mood", "family", "family expectations", "calm", "explain", "slowly"],
  },
  {
    id: "camila-torres",
    name: "Dr Camila Torres",
    shortName: "Dr Torres",
    gender: "woman",
    pronouns: "she/her",
    title: "General practitioner",
    suburb: "South Yarra",
    distance: "3.5 km away",
    image: "/clinicians/camila-torres.png",
    nextAvailable: "Monday, 11:20 am",
    acceptingNewPatients: true,
    focus: "Gestational diabetes & post-birth health",
    matchLine: "Spanish-language pregnancy and post-birth metabolic care built around real routines, not shame.",
    fitSignals: ["Gestational diabetes", "Spanish", "Post-birth care", "Weight-respectful care"],
    practicalSignals: ["Mixed billing", "26 min by tram", "Telehealth follow-ups"],
    about:
      "Camila supports gestational diabetes and post-birth metabolic health with practical plans for food, work, sleep and movement. She avoids weight-first assumptions and coordinates with maternity teams when needed.",
    experience: ["Gestational diabetes", "Post-birth recovery", "Metabolic health", "Shared maternity care"],
    languages: ["English", "Spanish"],
    careAreas: ["gestational-diabetes", "post-birth", "metabolic"],
    wheelchairAccessible: false,
    appointmentLength: "Standard and longer appointments",
    keywords: ["gestational diabetes", "pregnancy diabetes", "spanish", "woman", "women", "post-birth", "post birth", "postpartum", "metabolic", "blood sugar", "food", "weight stigma", "without shame", "maternity", "coordinate"],
  },
  {
    id: "leila-haddad",
    name: "Dr Leila Haddad",
    shortName: "Dr Haddad",
    gender: "woman",
    pronouns: "she/her",
    title: "General practitioner",
    suburb: "Carlton",
    distance: "2.4 km away",
    image: "/clinicians/leila-haddad.png",
    nextAvailable: "Thursday, 2:40 pm",
    acceptingNewPatients: true,
    focus: "Gestational diabetes & perinatal wellbeing",
    matchLine: "Arabic-language gestational diabetes care that includes anxiety, preferences and family context.",
    fitSignals: ["Gestational diabetes", "Arabic", "Perinatal mental health", "Women’s health"],
    practicalSignals: ["Bulk billing eligible", "20 min by tram", "Wheelchair accessible"],
    about:
      "Leila combines gestational-diabetes follow-up with calm support for anxiety and the emotional load of pregnancy. She can involve family when invited while keeping consent and the patient’s preferences explicit.",
    experience: ["Gestational diabetes", "Perinatal mental health", "Women’s health", "Shared maternity care"],
    languages: ["English", "Arabic"],
    careAreas: ["gestational-diabetes", "perinatal-mental-health"],
    wheelchairAccessible: true,
    appointmentLength: "Longer appointments available",
    keywords: ["gestational diabetes", "pregnancy diabetes", "arabic", "woman", "women", "anxiety", "anxious", "perinatal", "mental health", "hospital", "maternity", "coordinate", "family", "consent", "preferences"],
  },
  {
    id: "hanh-tran",
    name: "Dr Hanh Tran",
    shortName: "Dr Tran",
    gender: "woman",
    pronouns: "she/her",
    title: "General practitioner",
    suburb: "Footscray",
    distance: "5.0 km away",
    image: "/clinicians/hanh-tran.png",
    nextAvailable: "Friday, 10:10 am",
    acceptingNewPatients: true,
    focus: "Disability rights, kidney & post-birth care",
    matchLine: "Vietnamese-language care that centres disability rights, kidney health and patient autonomy.",
    fitSignals: ["Disability rights", "Vietnamese", "Kidney-aware care", "Post-birth care"],
    practicalSignals: ["Bulk bills care plans", "30 min by train", "Wheelchair accessible"],
    about:
      "Hanh supports disabled women and people balancing reproductive or post-birth care with kidney health. She plans around access needs, explains medication decisions clearly and centres consent and autonomy.",
    experience: ["Disability-rights focused care", "Kidney health", "Post-birth recovery", "Medication reviews"],
    languages: ["English", "Vietnamese"],
    careAreas: ["disability-rights", "kidney", "post-birth"],
    wheelchairAccessible: true,
    appointmentLength: "Longer appointments available",
    keywords: ["disability", "disabled", "disability rights", "wheelchair", "accessible", "autonomy", "consent", "vietnamese", "kidney", "renal", "post-birth", "post birth", "postpartum", "medicines", "medication", "coordinate"],
  },
  {
    id: "grace-chen",
    name: "Dr Grace Chen",
    shortName: "Dr Chen",
    gender: "woman",
    pronouns: "she/her",
    title: "General practitioner",
    suburb: "Abbotsford",
    distance: "2.6 km away",
    image: "/clinicians/grace-chen.png",
    nextAvailable: "Tuesday, 1:40 pm",
    acceptingNewPatients: true,
    focus: "ADHD & post-birth women’s health",
    matchLine: "Neurodiversity-affirming post-birth care with clear, realistic plans and low-pressure follow-up.",
    fitSignals: ["ADHD", "Post-birth care", "Women’s health", "Clear plans"],
    practicalSignals: ["Mixed billing", "19 min by tram", "Sensory-considerate rooms"],
    about:
      "Grace supports neurodivergent women through PCOS, pregnancy transitions and post-birth overload. She uses written steps, collaborative pacing and practical follow-up without moralising executive-function difficulty.",
    experience: ["Adult ADHD", "Women’s health", "Post-birth recovery", "PCOS support"],
    languages: ["English", "Mandarin"],
    careAreas: ["adhd", "post-birth", "pcos"],
    wheelchairAccessible: true,
    appointmentLength: "Standard and longer appointments",
    keywords: ["adhd", "attention", "neurodivergent", "executive function", "overwhelmed", "clear steps", "post-birth", "post birth", "postpartum", "woman", "women", "pcos", "mental health", "shared care", "realistic"],
  },
  {
    id: "erin-walsh",
    name: "Dr Erin Walsh",
    shortName: "Dr Walsh",
    gender: "woman",
    pronouns: "she/her",
    title: "General practitioner",
    suburb: "Brunswick East",
    distance: "3.1 km away",
    image: "/clinicians/erin-walsh.png",
    nextAvailable: "Monday, 1:20 pm",
    acceptingNewPatients: true,
    focus: "Birth trauma & perinatal mental health",
    matchLine: "Trauma-aware post-birth care with longer conversations and gentle, practical follow-up.",
    fitSignals: ["Birth trauma", "Perinatal mental health", "Post-birth care", "Longer visits"],
    practicalSignals: ["Bulk billing eligible", "23 min by tram", "Long appointments"],
    about:
      "Erin supports people experiencing anxiety, low mood, birth trauma or disconnection after pregnancy. Appointments move at the patient’s pace and connect emotional recovery with sleep, physical health and everyday support.",
    experience: ["Birth trauma", "Perinatal mental health", "Anxiety and mood", "Post-birth recovery"],
    languages: ["English"],
    careAreas: ["perinatal-mental-health", "post-birth"],
    wheelchairAccessible: false,
    appointmentLength: "Longer appointments available",
    keywords: ["birth trauma", "trauma", "perinatal", "post-birth", "post birth", "postpartum", "anxiety", "anxious", "depression", "disconnected", "gentle", "longer", "mental health", "unhurried"],
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
    "anjali-menon": [["pcos", 20], ["pmos", 20], ["polycystic", 20], ["south indian", 24], ["malayalam", 26], ["tamil", 26], ["cultural", 12], ["culture", 12], ["family pressure", 14], ["family", 8], ["mental health", 14], ["anxiety", 10], ["woman", 8], ["unhurried", 8]],
    "nisha-kapoor": [["pcos", 19], ["pmos", 19], ["polycystic", 19], ["hindi", 24], ["punjabi", 24], ["family expectations", 14], ["family", 8], ["mental health", 13], ["anxiety", 9], ["anxious", 9], ["calm", 10], ["explain", 9], ["slowly", 9], ["woman", 8]],
    "camila-torres": [["gestational diabetes", 22], ["pregnancy diabetes", 22], ["spanish", 26], ["post-birth", 16], ["post birth", 16], ["postpartum", 16], ["metabolic", 15], ["blood sugar", 14], ["weight stigma", 18], ["without shame", 16], ["maternity", 12], ["coordinate", 10], ["woman", 8]],
    "leila-haddad": [["gestational diabetes", 24], ["pregnancy diabetes", 24], ["arabic", 26], ["anxiety", 14], ["anxious", 14], ["mental health", 12], ["perinatal", 12], ["hospital team", 15], ["maternity", 14], ["coordinate", 12], ["family", 8], ["woman", 8]],
    "hanh-tran": [["disability rights", 28], ["disabled", 22], ["wheelchair", 22], ["autonomy", 18], ["consent", 15], ["accessible", 17], ["vietnamese", 26], ["renal", 20], ["kidney", 20], ["post-birth", 15], ["post birth", 15], ["postpartum", 15], ["medicines", 11], ["woman", 8]],
    "grace-chen": [["adhd", 24], ["attention", 16], ["neurodivergent", 26], ["executive function", 22], ["clear steps", 16], ["overwhelmed", 11], ["post-birth", 14], ["post birth", 14], ["postpartum", 14], ["pcos", 12], ["woman", 8]],
    "erin-walsh": [["birth trauma", 27], ["trauma", 20], ["perinatal", 22], ["post-birth", 13], ["post birth", 13], ["postpartum", 13], ["disconnected", 16], ["mental health", 17], ["anxiety", 14], ["anxious", 14], ["depression", 14], ["gentle", 11], ["longer", 10], ["woman", 8]],
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
      const requestsWoman = /\b(?:woman|female)\s+(?:gp|doctor|clinician)\b/.test(words)
        || /\bprefer(?:red)?\s+(?:a\s+)?woman\b/.test(words);
      const genderScore = requestsWoman && clinician.gender === "woman" ? 18 : 0;
      const languageScore = clinician.languages.some((language) =>
        language !== "English" && words.includes(language.toLowerCase()),
      ) ? 18 : 0;
      return focusScore + mannerScore + genderScore + languageScore;
    };

    return score(b) - score(a);
  });
}

export function cliniciansMatchingArchetype(archetype: CareArchetype): Clinician[] {
  const { requirements } = archetype;

  return clinicians.filter((clinician) => {
    const matchesGender = !requirements.preferredGender || clinician.gender === requirements.preferredGender;
    const matchesLanguage = !requirements.languageOptions?.length || requirements.languageOptions.some((language) =>
      clinician.languages.some((spoken) => spoken.toLowerCase() === language.toLowerCase()),
    );
    const matchesCareAreas = requirements.careAreas.every((area) => clinician.careAreas.includes(area));
    const matchesAccess = !requirements.wheelchairAccessible || clinician.wheelchairAccessible;

    return matchesGender && matchesLanguage && matchesCareAreas && matchesAccess;
  });
}

export function getPersonalizedMatch(clinician: Clinician, query: string) {
  const words = query.toLowerCase();
  const signals: string[] = [];
  const hasAny = (terms: string[]) => terms.some((term) => words.includes(term));

  if (hasAny(["pcos", "pmos", "polycystic"]) && clinician.careAreas.includes("pcos")) {
    signals.push("PCOS expertise");
  }
  if (hasAny(["gestational diabetes", "pregnancy diabetes"]) && clinician.careAreas.includes("gestational-diabetes")) {
    signals.push("Gestational diabetes");
  }
  if (hasAny(["post-birth", "post birth", "postpartum", "after birth", "giving birth"]) && clinician.careAreas.includes("post-birth")) {
    signals.push("Post-birth care");
  }
  if (hasAny(["adhd", "neurodivergent", "executive function"]) && clinician.careAreas.includes("adhd")) {
    signals.push("ADHD experience");
  }
  if (hasAny(["disability", "disabled", "wheelchair", "autonomy", "accessible"]) && clinician.careAreas.includes("disability-rights")) {
    signals.push("Disability rights");
  }
  if (hasAny(["kidney", "renal", "dialysis"]) && clinician.careAreas.includes("kidney")) {
    signals.push("Kidney-aware care");
  }
  if (hasAny(["metabolic", "strength", "energy", "sustainable", "healthier"]) && clinician.careAreas.includes("metabolic")) {
    signals.push("Metabolic health");
  }

  const requestedLanguage = clinician.languages.find((language) =>
    language !== "English" && words.includes(language.toLowerCase()),
  );
  if (requestedLanguage) signals.push(`${requestedLanguage}-speaking`);

  const requestsWoman = /\b(?:woman|female)\s+(?:gp|doctor|clinician)\b/.test(words)
    || /\bprefer(?:red)?\s+(?:a\s+)?woman\b/.test(words)
    || /\bsafer with (?:a\s+)?[^.]*woman gp\b/.test(words);
  if (requestsWoman && clinician.gender === "woman") signals.push("Woman GP");

  if (hasAny(["mental health", "emotion", "anxiety", "anxious", "mood", "trauma", "overwhelmed"]) && clinician.careAreas.includes("perinatal-mental-health")) {
    signals.push("Psychological safety");
  }
  if (hasAny(["weight stigma", "body image", "body shame", "without shame", "bounce back"]) && clinician.keywords.some((keyword) => ["weight stigma", "body image", "without shame", "bounce back"].includes(keyword))) {
    signals.push("Weight-respectful care");
  }
  if (hasAny(["wheelchair", "accessible"]) && clinician.wheelchairAccessible) {
    signals.push("Wheelchair accessible");
  }

  const uniqueSignals = [...new Set(signals)].slice(0, 4);
  const reason = uniqueSignals.length
    ? `Matches your stated priorities: ${uniqueSignals.join(" · ")}.`
    : "Accepting new patients—review the profile to decide whether this approach fits.";

  return { signals: uniqueSignals, reason };
}
