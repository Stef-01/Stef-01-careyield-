// W280 verify gate: "the read is practice-scoped as the query rather than filtered after, W209's
// rule; the finding is closed in W210's register with the mutation that would have caught it."
//
// THE MUTATION IS THE UNIT. TENANCY-1 was recorded at W209, made executable at W210, and stayed
// open for seventy units — not because it was hard, but because **nothing had ever shown this read
// a second practice**. Its own trigger says so: "the seeded rail holds sessions for more than one
// practice", and the seed holds one. A defect whose only defence is a fixture is a defect waiting
// for the fixture to change, which is precisely what W272 found happening one file over when the
// seed practice turned out not to be the console's practice at all.
//
// So the fixture here holds TWO practices sharing a clinician id on the same date, with different
// appointment types — the exact collision the finding describes. On the old code the first match
// wins and a patient at one practice is told they have a video appointment because a different
// practice's session came first in the array.
//
// AND THE ORDER IS ASSERTED BOTH WAYS, because `.find()` returning the first match is the whole
// mechanism: a fixture that only ever put the right practice first would pass against the broken
// code and prove nothing.

import { beforeEach, describe, expect, it } from "vitest";
import { getStore, resetStore, sessionAppointmentType } from "./store";
import type { AppointmentId, ClinicianId, PatientId, PracticeId } from "@/domain/types";

const MINE = "prac-1" as PracticeId;
const THEIRS = "prac-2" as PracticeId;
/** The same id at both practices. W166 mints clinician ids per practice, so this is possible. */
const SHARED_CLINICIAN = "clin-demo" as ClinicianId;
const DATE = "2026-09-01";

const appointment = (id: string, practiceId: PracticeId, telehealth: boolean) => ({
  id: id as AppointmentId,
  practiceId,
  clinicianId: SHARED_CLINICIAN,
  startsAt: `${DATE}T09:00:00+10:00`,
  status: "open" as const,
  patientId: null as PatientId | null,
  generatedByInvitation: false,
  appointmentType: telehealth ? ("telehealth" as const) : ("standard" as const),
});

/** Seed two practices' sessions, in a stated order, and hand back the store. */
function seedBoth(order: "theirs_first" | "mine_first") {
  resetStore();
  const store = getStore();
  const mine = appointment("apt-mine", MINE, false);
  const theirs = appointment("apt-theirs", THEIRS, true);
  store.state.appointments = order === "theirs_first" ? [theirs, mine] : [mine, theirs];
  return store;
}

const invitation = { practiceId: MINE, clinicianId: SHARED_CLINICIAN, sessionDate: DATE };

beforeEach(() => {
  resetStore();
});

describe("W280 the practice is in the query, not applied afterwards", () => {
  it("answers for the invitation's own practice when another practice is listed first", () => {
    // THE MUTATION THAT WOULD HAVE CAUGHT IT. Without the practice in the predicate this returns
    // "telehealth" — the other practice's session — and the patient is told they have a video
    // appointment for an in-person one.
    const store = seedBoth("theirs_first");
    expect(sessionAppointmentType(store, invitation)).toBe("standard");
  });

  it("answers the same way when its own practice is listed first", () => {
    // The other order, so the assertion above is about the SCOPING rather than about which row
    // the fixture happened to put first. A read that ignored the practice entirely would pass
    // this one and fail the one above; a read that took the last match would do the reverse.
    const store = seedBoth("mine_first");
    expect(sessionAppointmentType(store, invitation)).toBe("standard");
  });

  it("answers for the other practice when asked as the other practice", () => {
    // Both directions over the same rail. A read hard-coded to one practice would pass both of
    // the assertions above and fail this one.
    const store = seedBoth("mine_first");
    expect(
      sessionAppointmentType(store, { ...invitation, practiceId: THEIRS }),
    ).toBe("telehealth");
  });

  it("returns undefined for a practice with no session that day", () => {
    // The scoping narrows rather than falling back: a practice with nothing on the date gets no
    // answer, instead of quietly inheriting somebody else's.
    const store = seedBoth("mine_first");
    expect(
      sessionAppointmentType(store, { ...invitation, practiceId: "prac-9" as PracticeId }),
    ).toBeUndefined();
  });

  it("still answers the ordinary single-practice case", () => {
    // The seeded rail, unchanged. A fix that broke the normal path would be a worse defect than
    // the one it closed.
    const store = resetStore();
    const seeded = store.state.appointments[0]!;
    expect(
      sessionAppointmentType(store, {
        practiceId: String(seeded.practiceId),
        clinicianId: String(seeded.clinicianId),
        sessionDate: seeded.startsAt.slice(0, 10),
      }),
    ).toBe(seeded.appointmentType);
  });

  it("distinguishes the two practices' sessions in the fixture itself", () => {
    // Non-vacuity for every assertion above: if both sessions had the same type, or the same
    // practice, none of them would be measuring the scoping.
    const store = seedBoth("theirs_first");
    const types = new Set(store.state.appointments.map((a) => a.appointmentType));
    const practices = new Set(store.state.appointments.map((a) => String(a.practiceId)));
    const clinicians = new Set(store.state.appointments.map((a) => String(a.clinicianId)));
    expect(types.size).toBe(2);
    expect(practices.size).toBe(2);
    expect(clinicians.size, "the collision needs ONE clinician id at two practices").toBe(1);
  });
});
