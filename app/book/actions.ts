"use server";

import { revalidatePath } from "next/cache";
import { bookInStore } from "@/booking/store";
import { verifyBookingToken } from "@/booking/token";

export async function confirmBooking(formData: FormData): Promise<void> {
  const token = formData.get("token");
  if (typeof token !== "string") return;
  const invitationId = verifyBookingToken(token);
  if (!invitationId) return;
  bookInStore(invitationId, new Date().toISOString());
  revalidatePath(`/book/${token}`);
}
