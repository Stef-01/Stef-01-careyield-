import { cookies } from "next/headers";
import { interestSignupsCsv } from "@/interest/store";
import { SESSION_COOKIE, verifySession } from "@/console/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const jar = await cookies();
  if (!verifySession(jar.get(SESSION_COOKIE)?.value)) {
    return new Response("Sign in required", { status: 401 });
  }

  return new Response(interestSignupsCsv(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="careyield-community-interest.csv"',
      "Cache-Control": "no-store",
    },
  });
}
