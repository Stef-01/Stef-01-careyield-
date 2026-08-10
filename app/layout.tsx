import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareYield — find a GP who fits",
  description:
    "Describe the kind of GP you want to see and explore tailored clinician profiles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">{children}</body>
    </html>
  );
}
