// W6: provider-agnostic SMS adapter. Mock only until founder gate G3 (live SMS).

import type { Invitation, Patient } from "@/domain/types";

export interface OutboundSms {
  to: string; // synthetic identifier in this phase — never a real phone number
  body: string;
  invitationId: string;
}

export interface SmsAdapter {
  send(message: OutboundSms): Promise<{ delivered: boolean }>;
}

export class MockSmsAdapter implements SmsAdapter {
  readonly sent: OutboundSms[] = [];
  async send(message: OutboundSms): Promise<{ delivered: boolean }> {
    this.sent.push(message);
    return { delivered: true };
  }
}

/**
 * STOP handling — terminal, in one place.
 * Returns updated copies: the patient is opted out forever; every outstanding
 * invitation for them is closed as opted_out. No pathway re-enables contact.
 */
export function handleStop(
  patient: Patient,
  invitations: Invitation[],
): { patient: Patient; invitations: Invitation[] } {
  return {
    patient: { ...patient, optedOut: true },
    invitations: invitations.map((inv) =>
      inv.patientId === patient.id && (inv.status === "queued" || inv.status === "sent")
        ? { ...inv, status: "opted_out" }
        : inv,
    ),
  };
}
