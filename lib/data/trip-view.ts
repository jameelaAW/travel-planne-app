import { cache } from "react";
import { summarizeTrip } from "@/lib/budget";
import { listCategories } from "./categories";
import { listExpenses } from "./expenses";
import { getTrip, listTrips } from "./trips";

/** Everything a trip screen needs, fetched once per request (shared by layout + page). */
export const loadTripView = cache(async (id: string) => {
  const trip = await getTrip(id);
  if (!trip) return null;
  const [categories, expenses] = await Promise.all([listCategories(id), listExpenses(id)]);
  return { trip, categories, expenses, summary: summarizeTrip(trip, categories, expenses) };
});

export const loadTripList = cache(listTrips);
