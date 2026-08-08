import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/console/session";

/**
 * Authorization primitive for the console — returns the signed-in email or
 * redirects to sign-in. Used by both server components and mutating server
 * actions (in an action the redirect throws NEXT_REDIRECT, which Next handles).
 */
export async function requireSession(): Promise<string> {
  const jar = await cookies();
  const email = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!email) redirect("/console/signin");
  return email;
}
