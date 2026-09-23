import { AuthForm } from "@/components/auth/AuthForm";

export const metadata = { title: "Sign in · Trip Budget Planner" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; mode?: string }> }) {
  const { next, error, mode } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-lg font-bold text-teal-800">Trip Budget</p>
          <p className="text-sm text-slate-500">Plan where every dollar goes before you book.</p>
        </div>
        <AuthForm next={next ?? "/"} initialError={error ?? null} initialMode={mode === "signup" ? "signup" : "signin"} />
      </div>
    </main>
  );
}
