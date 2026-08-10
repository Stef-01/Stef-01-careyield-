export type CareArchetype = {
  id: string;
  title: string;
  eyebrow: string;
  example: string;
  request: string;
  headline: string;
  expectedFirstMatch: string;
};

export const careArchetypes: CareArchetype[] = [
  {
    id: "south-indian-pcos",
    title: "PCOS + South Indian context",
    eyebrow: "Culture and emotional safety",
    example: "A woman GP with PCOS experience who speaks Tamil or Malayalam and understands family pressure.",
    request:
      "I’m a young South Indian woman navigating PCOS and a difficult time with my mental health. I want a woman GP who speaks Tamil or Malayalam, understands family pressure and gives me time without judgement.",
    headline: "PCOS, language and emotional safety.",
    expectedFirstMatch: "priya-nair",
  },
  {
    id: "hindi-punjabi-pcos",
    title: "PCOS + Hindi family context",
    eyebrow: "Family dynamics and mood",
    example: "A calm woman GP who speaks Hindi or Punjabi and understands the emotional side of PCOS.",
    request:
      "I want a calm woman GP for PCOS who speaks Hindi or Punjabi. I’m anxious about symptoms and family expectations, and I need someone collaborative who will explain choices slowly.",
    headline: "PCOS care that includes family and mood.",
    expectedFirstMatch: "maya-singh",
  },
  {
    id: "spanish-gestational-diabetes",
    title: "Gestational diabetes + Spanish",
    eyebrow: "Language and practical nutrition",
    example: "A Spanish-speaking woman GP for gestational diabetes who won’t make every conversation about weight.",
    request:
      "I have gestational diabetes and would feel safer with a Spanish-speaking woman GP. I want practical support around food, work and blood sugar without weight stigma or shame.",
    headline: "Gestational diabetes without weight stigma.",
    expectedFirstMatch: "sofia-alvarez",
  },
  {
    id: "arabic-gestational-diabetes",
    title: "Gestational diabetes + Arabic",
    eyebrow: "Complex care in your language",
    example: "An Arabic-speaking woman GP who can coordinate gestational diabetes care and make space for anxiety.",
    request:
      "I’m managing gestational diabetes alongside other health needs. I want an Arabic-speaking woman GP who can coordinate with my hospital team, include my preferences and understand how anxious this feels.",
    headline: "Gestational diabetes with joined-up support.",
    expectedFirstMatch: "aisha-rahman",
  },
  {
    id: "post-birth-trauma",
    title: "Post-birth emotional recovery",
    eyebrow: "Trauma-aware conversations",
    example: "A gentle GP who understands birth trauma, anxiety and the pressure to seem fine after having a baby.",
    request:
      "Since giving birth I’ve felt anxious and disconnected from myself. I need a gentle GP who understands birth trauma and perinatal mental health, offers longer appointments and won’t rush me.",
    headline: "Post-birth emotional recovery, gently.",
    expectedFirstMatch: "noah-williams",
  },
  {
    id: "post-birth-strength",
    title: "Post-birth strength and energy",
    eyebrow: "Health beyond the scales",
    example: "A GP who can help me rebuild strength and energy after birth without body shame or crash-diet advice.",
    request:
      "I want to feel healthier and rebuild strength and energy after giving birth. I need a GP who understands cardiometabolic health, body image and the emotional pressure to ‘bounce back’ without making weight the only goal.",
    headline: "Post-birth strength, without body shame.",
    expectedFirstMatch: "daniel-okafor",
  },
  {
    id: "neurodivergent-post-birth",
    title: "Neurodivergent post-birth care",
    eyebrow: "Structure without pressure",
    example: "A GP who understands ADHD, post-birth overwhelm and gives me a clear plan I can actually follow.",
    request:
      "I’m neurodivergent and overwhelmed since having my baby. I want a GP with ADHD and women’s-health experience who uses clear steps, checks what is realistic and doesn’t interpret executive-function difficulty as not caring.",
    headline: "Post-birth care that works with your brain.",
    expectedFirstMatch: "tom-bennett",
  },
  {
    id: "vietnamese-disability-rights",
    title: "Disability-rights women’s care",
    eyebrow: "Access, autonomy and language",
    example: "A Vietnamese-speaking GP who understands disability rights and centres my choices in women’s healthcare.",
    request:
      "I’m a disabled Vietnamese-speaking woman looking for reproductive and metabolic care. I need a wheelchair-accessible practice and a GP who understands disability rights, speaks Vietnamese and centres my consent and autonomy.",
    headline: "Accessible women’s care, on your terms.",
    expectedFirstMatch: "linh-nguyen",
  },
  {
    id: "post-birth-kidney-care",
    title: "Post-birth kidney-aware care",
    eyebrow: "Recovery with complex health needs",
    example: "A Vietnamese-speaking GP who can support post-birth recovery while keeping kidney health in view.",
    request:
      "I want support rebuilding my health after birth while managing kidney concerns. I would prefer a Vietnamese-speaking woman GP who can coordinate care, review medicines and explain decisions without rushing me.",
    headline: "Post-birth recovery with kidney-aware care.",
    expectedFirstMatch: "linh-nguyen",
  },
  {
    id: "pcos-metabolic-reset",
    title: "PCOS + sustainable health goals",
    eyebrow: "Metabolic care without shame",
    example: "A GP who understands PCOS and can help me build sustainable health habits without reducing me to my weight.",
    request:
      "I want to feel stronger and healthier while managing PCOS. I need a woman GP with metabolic-health experience who will talk about sleep, food, movement and mental wellbeing without shame or extreme targets.",
    headline: "PCOS and sustainable health, without shame.",
    expectedFirstMatch: "sofia-alvarez",
  },
];
