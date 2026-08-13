// W281: the community interest form's reasons and its stored signup shape.
//
// `INTEREST_REASONS` is rendered on a public form, so it is operator copy by any reading and was
// covered by nothing until this unit declared it.
//
// WRITTEN OUTSIDE THE UNIT LOOP, which is why it had no header to move. Its creating commit
// carries no unit number at all — the four modules in this class arrived on 2026-08-09 between
// W51 and W65, from founder-side work rather than from a firing. W281 adopts them: a module the
// loop did not write is still a module the copy census has to see, and for a year it did not.
export const INTEREST_REASONS = [
  "I want to learn more about PMOS",
  "I want to bring a session to my community",
  "I’m a clinician",
] as const;

export type InterestReason = (typeof INTEREST_REASONS)[number];

export interface InterestSignup {
  id: string;
  name: string;
  email: string;
  interests: InterestReason[];
  consentedAt: string;
  createdAt: string;
  source: "western-sydney-community-landing";
}

export interface InterestFormState {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: Partial<Record<"name" | "email" | "interests" | "consent", string>>;
}
