import type { Metadata } from "next";
import { Suspense } from "react";
import { AppShell } from "@/components/nav/AppShell";
import { TripNav, TripNavSkeleton } from "@/components/nav/TripNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trip Budget Planner",
  description: "Allocate your travel budget across categories and see overspending before you book.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AppShell
          nav={
            <Suspense fallback={<TripNavSkeleton />}>
              <TripNav />
            </Suspense>
          }
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
