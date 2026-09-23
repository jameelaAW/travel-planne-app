import type { Metadata } from "next";
import { Suspense } from "react";
import { allRateTables, preferredSource } from "@/lib/fx";
import { AppShell } from "@/components/nav/AppShell";
import { TripNav, TripNavSkeleton } from "@/components/nav/TripNav";
import { AccountMenu } from "@/components/nav/AccountMenu";
import { FxProvider, RateSourcePicker } from "@/components/fx/FxProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trip Budget Planner",
  description: "Allocate your travel budget across categories and see overspending before you book.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [tables, preferred] = await Promise.all([allRateTables(), preferredSource()]);
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <FxProvider tables={tables} preferred={preferred}>
          <AppShell
            nav={
              <>
                <Suspense fallback={<TripNavSkeleton />}>
                  <TripNav />
                </Suspense>
                <RateSourcePicker />
                <Suspense fallback={null}>
                  <AccountMenu />
                </Suspense>
              </>
            }
          >
            {children}
          </AppShell>
        </FxProvider>
      </body>
    </html>
  );
}
