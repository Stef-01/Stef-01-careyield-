import { signIn } from "../actions";
import { ConsoleShell, ErrorNote, Field, inputClass, primaryButtonClass } from "../ui";

export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <ConsoleShell email={null}>
      <div className="mx-auto max-w-sm">
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mb-6 text-sm text-stone-500">
          Synthetic build: any staff email signs in. Production uses practice single sign-on.
        </p>
        <ErrorNote show={error === "1"} />
        <form action={signIn} className="mt-4 flex flex-col gap-4">
          <Field label="Work email">
            <input name="email" type="email" required placeholder="you@practice.com.au" className={inputClass} />
          </Field>
          <button type="submit" className={primaryButtonClass}>
            Sign in
          </button>
        </form>
      </div>
    </ConsoleShell>
  );
}
