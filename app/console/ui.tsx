// W11: shared console primitives — one look for every console surface.

import { signOut } from "./actions";
import { DemoNavigator } from "../demo-navigator";
import Link from "next/link";

export function ConsoleShell({
  email,
  children,
}: {
  email: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <div className="flex items-baseline gap-3">
            <DemoNavigator />
            <span className="text-sm text-stone-500">practice console</span>
          </div>
          {email && (
            <form action={signOut} className="flex items-center gap-3">
              <Link href="/console/interest" className="text-sm text-stone-500 underline hover:text-stone-800">Interest</Link>
              <span className="text-sm text-stone-500">{email}</span>
              <button type="submit" className="text-sm text-stone-500 underline hover:text-stone-800">
                Sign out
              </button>
            </form>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 " +
  "focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200";

export const primaryButtonClass =
  "rounded-lg bg-stone-900 px-5 py-2.5 font-medium text-white hover:bg-stone-700 " +
  "focus:outline-none focus:ring-2 focus:ring-stone-400";

export function ErrorNote({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Some values couldn't be saved — please check them and try again.
    </p>
  );
}
