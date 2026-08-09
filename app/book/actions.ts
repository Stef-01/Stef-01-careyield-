"use server";

import { revalidatePath } from "next/cache";
import { bookInStore } from "@/booking/store";
import { verifyBookingToken } from "@/booking/token";
import { rateLimit } from "@/lib/rate-limit";

export async function confirmBooking(formData: FormData): Promise<void> {
  const token = formData.get("token");
  if (typeof token !== "string") return;
  const invitationId = verifyBookingToken(token);
  if (!invitationId) return;
  // W37: unauthenticated endpoint — throttle per invitation; a patient never needs
  // more than a handful of attempts, replay floods do.
  if (!rateLimit("booking-confirm", invitationId, { limit: 10, windowMs: 60_000 })) return;
  bookInStore(invitationId, new Date().toISOString());
  revalidatePath(`/book/${token}`);
}
