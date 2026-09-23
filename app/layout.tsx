import type { Metadata } from "next";
import { Suspense } from "react";
import { supportedCurrencies } from "@/lib/fx/ecb";
import { AppShell } from "@/components/nav/AppShell";
import { TripNav, TripNavSkeleton } from "@/components/nav/TripNav";
import { FxProvider } from "@/components/fx/FxProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trip Budget Planner",
  description: "Allocate your travel budget across categories and see overspending before you book.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { rates } = await supportedCurrencies();
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <FxProvider rates={rates}>
          <AppShell
            nav={
              <Suspense fallback={<TripNavSkeleton />}>
                <TripNav />
              </Suspense>
            }
          >
            {children}
          </AppShell>
        </FxProvider>
      </body>
    </html>
  );
}
