export const INTEREST_REASONS = [
  "I think I might have this",
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
