// W1: the build-unit stamp. Its own `BUILD_UNIT` value is where the unit was recorded before
// W281 gave it a header — a module that knew its unit as DATA and not as a header, which is
// the same miss as `domain/types.ts` in the other direction.
export const BUILD_UNIT = "W1";

export function appName(): string {
  return "Meherr";
}
