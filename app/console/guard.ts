import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "@/console/session";

/** Server-component auth guard: returns the signed-in email or redirects to sign-in. */
export async function requireSession(): Promise<string> {
  const jar = await cookies();
  const email = verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!email) redirect("/console/signin");
  return email;
}
