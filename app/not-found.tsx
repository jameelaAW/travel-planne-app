import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <h1 className="text-lg font-semibold">Trip not found</h1>
      <p className="mt-1 text-sm text-slate-600">It may have been deleted.</p>
      <Link href="/" className="mt-4 inline-block text-sm text-teal-700 hover:underline">
        ← Back to all trips
      </Link>
    </main>
  );
}
