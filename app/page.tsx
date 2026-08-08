export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">CareYield</h1>
      <p className="text-lg text-stone-600">
        Continuity yield for general practice: unused appointment supply, matched to the
        established patients most likely to value a return visit to their usual GP.
      </p>
      <p className="text-sm text-stone-400">
        Build W1 scaffold · synthetic data only · no clinical claims on any surface
      </p>
    </main>
  );
}
