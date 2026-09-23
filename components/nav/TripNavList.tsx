"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "", label: "Overview" },
  { href: "/categories", label: "Categories" },
  { href: "/expenses", label: "Expenses" },
];

export function TripNavList({ trips, error }: { trips: { id: string; title: string }[]; error?: string }) {
  const pathname = usePathname();
  const activeId = pathname.match(/^\/trips\/([^/]+)/)?.[1];

  const item = (active: boolean) =>
    `block rounded-md px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-teal-600 ${active ? "bg-teal-50 font-medium text-teal-900" : "text-slate-700 hover:bg-slate-100"}`;

  return (
    <nav aria-label="Trips" className="flex-1 space-y-1 px-3 pb-6 pt-3 lg:pt-0">
      <Link href="/" className={item(pathname === "/")} aria-current={pathname === "/" ? "page" : undefined}>
        All trips
      </Link>
      <p className="px-3 pt-4 pb-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">Your trips</p>
      {error && <p className="px-3 text-xs text-red-600">{error}</p>}
      {!error && trips.length === 0 && <p className="px-3 text-xs text-slate-500">No trips yet.</p>}
      <ul className="space-y-0.5">
        {trips.map((t) => {
          const isActive = t.id === activeId;
          return (
            <li key={t.id}>
              <Link href={`/trips/${t.id}`} className={item(isActive && pathname === `/trips/${t.id}`)}>
                <span className="block truncate">{t.title}</span>
              </Link>
              {isActive && (
                <ul className="mt-0.5 mb-1 ml-3 space-y-0.5 border-l border-slate-200 pl-2" aria-label={`${t.title} sections`}>
                  {SECTIONS.map((s) => {
                    const href = `/trips/${t.id}${s.href}`;
                    const current = pathname === href;
                    return (
                      <li key={s.label}>
                        <Link href={href} className={item(current)} aria-current={current ? "page" : undefined}>
                          {s.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
