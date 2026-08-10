// W7: booking page behind the tokenised deep link (mock rail, synthetic data only).
// Copy discipline mirrors the W6 linter posture: availability language only —
// no urgency, no clinical framing, no benefit claims.

import { getStore, sessionAppointmentType } from "@/booking/store";
import { verifyBookingToken } from "@/booking/token";
import { confirmBooking } from "../actions";

export const dynamic = "force-dynamic";

// W49 follow-up: pin a route-level <title>. The confirm action revalidates this
// route, and during that swap the inherited layout title can be momentarily absent —
// axe caught it as a document-title violation (WCAG 2.4.2). A patient-facing page
// reached from an SMS deserves its own title regardless.
export const metadata = { title: "Your appointment — CareYield" };

function Panel({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-6">
      <h1 className="text-2xl font-semibold tracking-tight">{heading}</h1>
      {children}
    </main>
  );
}

export default async function BookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitationId = verifyBookingToken(token);
  const store = getStore();
  const invitation = invitationId
    ? store.state.invitations.find((i) => i.id === invitationId)
    : undefined;

  if (!invitation) {
    return (
      <Panel heading="This booking link isn't valid">
        <p className="text-stone-600">
          The link may have been copied incompletely. Please contact the practice to book.
        </p>
      </Panel>
    );
  }

  const isTelehealth = sessionAppointmentType(store, invitation) === "telehealth";
  const kind = isTelehealth ? "video appointment" : "appointment";

  if (invitation.status === "booked") {
    const appointment = store.state.appointments.find(
      (a) => a.patientId === invitation.patientId && a.generatedByInvitation,
    );
    return (
      <Panel heading={`Your ${kind} is booked`}>
        <p className="text-stone-600">
          {store.clinicianName} at {store.practiceName}
          {appointment ? ` — ${new Date(appointment.startsAt).toLocaleString("en-AU")}` : ""}.
        </p>
        <p className="text-sm text-stone-500">
          {isTelehealth
            ? "The practice will call you at this time. If you can no longer attend, please contact the practice."
            : "If you can no longer attend, please contact the practice."}
        </p>
      </Panel>
    );
  }

  if (invitation.status === "expired") {
    return (
      <Panel heading="This appointment offer is no longer available">
        <p className="text-stone-600">
          The session has filled. No action is needed — you can contact {store.practiceName} any
          time to arrange another appointment.
        </p>
      </Panel>
    );
  }

  if (invitation.status === "opted_out") {
    return (
      <Panel heading="You've opted out">
        <p className="text-stone-600">
          You won't receive further availability messages from {store.practiceName}.
        </p>
      </Panel>
    );
  }

  return (
    <Panel heading={isTelehealth ? "A video appointment is available" : "An appointment is available"}>
      <p className="text-stone-600">
        {store.clinicianName} at {store.practiceName} has{" "}
        {isTelehealth ? "telehealth (phone/video) appointment times" : "appointment times"} available on{" "}
        {new Date(`${invitation.sessionDate}T00:00:00`).toLocaleDateString("en-AU", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        .
      </p>
      <form action={confirmBooking}>
        <input type="hidden" name="token" value={token} />
        <button
          type="submit"
          className="rounded-lg bg-stone-900 px-5 py-2.5 font-medium text-white hover:bg-stone-700"
        >
          Confirm booking
        </button>
      </form>
      <p className="text-sm text-stone-500">
        No action is needed if this time doesn't suit you.
      </p>
    </Panel>
  );
}
