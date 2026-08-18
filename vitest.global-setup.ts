// W328: the run-level moment. Vitest calls `setup` once before any worker starts and `teardown`
// once after every worker has finished — the only moment that sees a residue left by any file in
// the run, whatever order the files happened to execute in.
//
// The derivation lives in `src/quality/repository-clean.ts` and is read by that module's suite too;
// this file is the wiring, and it lives outside `src/` because it is configuration rather than a
// module of the product — the registers walk `src/`, and a hook they would each have to declare
// pays a tax for being in a place it does not belong.

import { uncleanMessage } from "./src/quality/repository-clean";

export function setup(): void {
  // Nothing to prepare. The check is the teardown; the pair exists because vitest's hook is a pair.
}

export function teardown(): void {
  const message = uncleanMessage(process.cwd());
  if (message !== null) throw new Error(message);
}
